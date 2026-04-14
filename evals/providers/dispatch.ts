import { mkdtempSync, cpSync, writeFileSync, rmSync, existsSync, readdirSync } from "fs";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

import { TrajectoryAccumulator, type ExecuteResult } from "./_trajectory.ts";

//-----------------------------------------------------------------------------

interface ProviderResponse {
  output: string | object;
  error?: string;
  tokenUsage?: {
    total?: number;
    prompt?: number;
    completion?: number;
  };
  cost?: number;
}

interface ProviderOptions {
  id?: string;
  config?: {
    timeoutMs?: number;
  };
}

interface CallApiContext {
  vars: {
    fixture: string;
    prime?: boolean;
    model?: string;
  };
}

//-----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// project root resolution — evals/providers/dispatch.ts → ../../
const PROJECT_ROOT = join(__dirname, "..", "..");
const SKILL_SOURCE = join(PROJECT_ROOT, "skill");

//-----------------------------------------------------------------------------

export default class DispatchProvider {
  private timeoutMs: number;

  constructor(options: ProviderOptions) {
    this.timeoutMs = options.config?.timeoutMs ?? 120_000;
  }

  id() {
    return "dispatch";
  }

  // sets up two temp dirs: one for the fixture KB (becomes cwd), one for
  // CLAUDE_CONFIG_DIR (isolated user-scope config with the mnemo skill staged).
  // keeping them separate makes each dir's purpose obvious when debugging.

  // detects fixture layout and returns the bases to register.
  // single-base: fixtures with an AGENTS.md at the root use the whole dir as `eval`.
  // multi-base: fixtures without a root AGENTS.md treat each top-level directory as a base.

  private detectBases(fixtureDir: string): Record<string, string> {
    if (existsSync(join(fixtureDir, "AGENTS.md"))) {
      return { eval: fixtureDir };
    }

    const bases: Record<string, string> = {};
    for (const entry of readdirSync(fixtureDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        bases[entry.name] = join(fixtureDir, entry.name);
      }
    }
    return bases;
  }

  private setup(fixtureName: string) {
    // copy the fixture kb to a temp directory
    const fixtureSource = join(__dirname, "..", "fixtures", fixtureName);
    const fixtureDir = mkdtempSync(join(tmpdir(), "mnemo-dispatch-fixture-"));
    cpSync(fixtureSource, fixtureDir, { recursive: true });

    // register bases in a mnemo config
    const bases = this.detectBases(fixtureDir);
    const basesYaml = Object.entries(bases)
      .map(([name, path]) => `  ${name}: ${path}`)
      .join("\n");
    const mnemoConfig = join(fixtureDir, ".mnemo-config.yml");
    writeFileSync(mnemoConfig, `bases:\n${basesYaml}\n`);

    // isolate CLAUDE_CONFIG_DIR so nothing from ~/.claude leaks in
    const configDir = mkdtempSync(join(tmpdir(), "mnemo-dispatch-config-"));

    // stage the mnemo skill so Claude Code discovers it
    const skillDest = join(configDir, "skills", "mnemo");
    cpSync(SKILL_SOURCE, skillDest, { recursive: true });

    return { fixtureDir, configDir, mnemoConfig };
  }

  // cleans up both temp dirs

  private teardown(fixtureDir: string, configDir: string) {
    rmSync(fixtureDir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  }

  // composes the --settings JSON for primed cases: a SessionStart hook that
  // runs mnemo prime. returns null when unprimed so we can omit --settings entirely.
  // toggling the hook is how the primed/unprimed ablation is mechanically implemented.

  private buildSettings(primed: boolean): string | null {
    if (!primed) return null;

    const settings = {
      hooks: {
        SessionStart: [
          {
            hooks: [{ type: "command", command: "mnemo prime" }],
          },
        ],
      },
    };

    return JSON.stringify(settings);
  }

  // spawns claude -p in non-bare mode so the default system prompt runs,
  // skills auto-load from CLAUDE_CONFIG_DIR, and SessionStart hooks fire.
  // consumes --output-format stream-json line-by-line to accumulate the full
  // trajectory from stdout — no filesystem session file reads.

  private async execute(
    fixtureDir: string,
    configDir: string,
    mnemoConfig: string,
    settings: string | null,
    message: string,
    model?: string,
  ): Promise<ExecuteResult> {
    return new Promise<ExecuteResult>((resolve, reject) => {
      const accumulator = new TrajectoryAccumulator();
      let lineBuffer = "";
      let stderr = "";
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        fn();
      };

      // parses complete lines from the rolling buffer and feeds them to the
      // accumulator; leaves any partial tail for the next chunk
      const drainLines = () => {
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            accumulator.processEvent(JSON.parse(line));
          } catch {
            // malformed line — skip, keep going
          }
        }
      };

      const args = [
        "-p",
        "--output-format",
        "stream-json",
        "--verbose",
        "--permission-mode",
        "bypassPermissions",
      ];
      if (settings) args.push("--settings", settings);
      if (model) args.push("--model", model);
      args.push(message);

      const proc = spawn("claude", args, {
        cwd: fixtureDir,
        env: {
          ...process.env,
          CLAUDE_CONFIG_DIR: configDir,
          MNEMO_CONFIG: mnemoConfig,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });

      proc.stdout.on("data", (chunk: Buffer) => {
        lineBuffer += chunk.toString();
        drainLines();
      });
      proc.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on("error", (err) => {
        settle(() =>
          reject(new Error(`Failed to spawn claude: ${err.message}`)),
        );
      });

      proc.on("close", (code) => {
        settle(() => {
          // flush any remaining line in the buffer
          if (lineBuffer.trim()) {
            try {
              accumulator.processEvent(JSON.parse(lineBuffer));
            } catch {}
            lineBuffer = "";
          }

          if (code !== 0) {
            reject(new Error(`claude exited with code ${code}: ${stderr}`));
            return;
          }

          resolve(accumulator.finalize());
        });
      });

      // timeout — configurable via provider config, defaults to 120s
      const timer = setTimeout(() => {
        proc.kill("SIGTERM");
        setTimeout(() => {
          try {
            proc.kill("SIGKILL");
          } catch {}
        }, 2000);
        settle(() =>
          reject(
            new Error(
              `Dispatch timed out after ${this.timeoutMs / 1000}s. stderr: ${stderr}`,
            ),
          ),
        );
      }, this.timeoutMs);
    });
  }

  // orchestrates one eval run

  async callApi(
    prompt: string,
    context: CallApiContext,
  ): Promise<ProviderResponse> {
    const { fixture, prime = true, model } = context.vars;
    const { fixtureDir, configDir, mnemoConfig } = this.setup(fixture);

    try {
      const settings = this.buildSettings(prime);
      const state = await this.execute(
        fixtureDir,
        configDir,
        mnemoConfig,
        settings,
        prompt,
        model,
      );

      const resolvedModel = state.modelUsage
        ? Object.keys(state.modelUsage)[0]
        : "unknown";
      const usage = state.usage;

      return {
        output: {
          tool_calls: state.toolCalls,
          result: state.result,
          session_id: state.sessionId,
          duration_ms: state.durationMs,
          num_turns: state.numTurns,
          stop_reason: state.stopReason,
          model: resolvedModel,
          primed: prime,
        },
        tokenUsage: {
          total:
            ((usage?.input_tokens as number) ?? 0) +
            ((usage?.output_tokens as number) ?? 0),
          prompt: usage?.input_tokens as number,
          completion: usage?.output_tokens as number,
        },
        cost: state.cost,
      };
    } catch (error) {
      return {
        output: { status: "ERROR", message: String(error) },
        error: String(error),
      };
    } finally {
      this.teardown(fixtureDir, configDir);
    }
  }
}
