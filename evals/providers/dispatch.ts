import { mkdtempSync, mkdirSync, cpSync, writeFileSync, rmSync, readdirSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { spawn } from "child_process";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { TrajectoryAccumulator, setupFixture } from "./_shared";
import type { ExecuteResult, ProviderResponse, ProviderOptions } from "./_shared";

//-----------------------------------------------------------------------------

interface TestAssertion {
  type?: string;
  value?: string;
  metric?: string;
  weight?: number;
}

interface CallApiContext {
  vars: {
    fixture: string;
    prime?: boolean;
    model?: string;
  };
  test?: {
    description?: string;
    assert?: TestAssertion[];
  };
}

//-----------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// project root resolution — evals/providers/dispatch.ts → ../../
const PROJECT_ROOT = join(__dirname, "..", "..");
const SKILL_SOURCE = join(PROJECT_ROOT, "skill");
const RUNS_DIR = join(PROJECT_ROOT, "evals", "runs");

//-----------------------------------------------------------------------------

export default class DispatchProvider {
  private timeoutMs: number;
  private runDir: string;
  private callIndex = 0;

  constructor(options: ProviderOptions) {
    this.timeoutMs = options.config?.timeoutMs ?? 120_000;

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    this.runDir = join(RUNS_DIR, ts);
    mkdirSync(this.runDir, { recursive: true });
  }

  id() {
    return "dispatch";
  }

  /** checks for common env issues that produce cryptic failures */

  private preflightDone = false;

  private preflight() {
    if (this.preflightDone) return;
    this.preflightDone = true;

    const missing: string[] = [];
    try { execSync("which claude", { stdio: "ignore" }); } catch { missing.push("claude"); }
    try { execSync("which mnemo", { stdio: "ignore" }); } catch { missing.push("mnemo"); }

    if (missing.length > 0) {
      throw new Error(`[dispatch] required binaries not on PATH: ${missing.join(", ")}`);
    }

    const hasAuth = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN;
    if (!hasAuth) {
      console.warn(
        "[dispatch] ⚠ no auth found — isolated CLAUDE_CONFIG_DIR requires ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN"
      );
    }
  }

  /** writes raw stream-json lines to a trajectory file for post-run inspection */

  private writeTrajectory(
    index: number,
    prompt: string,
    rawLines: string[],
    test?: CallApiContext["test"],
  ) {
    if (rawLines.length === 0) return;
    const slug = prompt.slice(0, 50).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const filename = `${index}-${slug}.jsonl`;
    const meta = JSON.stringify({
      type: "meta",
      prompt,
      index,
      timestamp: new Date().toISOString(),
      description: test?.description,
      assertions: test?.assert,
    });
    writeFileSync(join(this.runDir, filename), meta + "\n" + rawLines.join("\n") + "\n");
  }

  /** walks a directory and returns a map of relative-path → sha256 */

  private snapshotDir(root: string): Map<string, string> {
    const snapshot = new Map<string, string>();
    const walk = (dir: string, prefix: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(full, rel);
        } else if (entry.isFile()) {
          const hash = createHash("sha256").update(readFileSync(full)).digest("hex");
          snapshot.set(rel, hash);
        }
      }
    };
    walk(root, "");
    return snapshot;
  }

  /** diffs two snapshots into created / modified / deleted path lists */

  private diffSnapshots(
    before: Map<string, string>,
    after: Map<string, string>,
  ): { created: string[]; modified: string[]; deleted: string[] } {
    const created: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    for (const [path, hash] of after) {
      const prev = before.get(path);
      if (prev === undefined) created.push(path);
      else if (prev !== hash) modified.push(path);
    }
    for (const path of before.keys()) {
      if (!after.has(path)) deleted.push(path);
    }
    return {
      created: created.sort(),
      modified: modified.sort(),
      deleted: deleted.sort(),
    };
  }

  /** sets up fixture and isolated claude config dirs */

  private setup(fixtureName: string) {
    const { fixtureDir, mnemoConfig } = setupFixture(fixtureName, "mnemo-dispatch-fixture-");

    // isolate CLAUDE_CONFIG_DIR so nothing from ~/.claude leaks in
    const configDir = mkdtempSync(join(tmpdir(), "mnemo-dispatch-config-"));

    // stage the mnemo skill so Claude Code discovers it
    const skillDest = join(configDir, "skills", "mnemo");
    cpSync(SKILL_SOURCE, skillDest, { recursive: true });

    // stage agents to the discovery path so Claude Code resolves named agents
    const agentsSource = join(SKILL_SOURCE, "agents");
    const agentsDest = join(configDir, "agents");
    mkdirSync(agentsDest, { recursive: true });
    for (const file of readdirSync(agentsSource)) {
      if (!file.endsWith(".md")) continue;
      cpSync(join(agentsSource, file), join(agentsDest, `mnemo-${file}`));
    }

    return { fixtureDir, configDir, mnemoConfig };
  }

  /** cleans up both temp dirs */

  private teardown(fixtureDir: string, configDir: string) {
    rmSync(fixtureDir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  }

  /** composes --settings JSON with a SessionStart hook for primed cases */

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

  /** spawns claude -p and accumulates the stream-json trajectory */

  private async execute(
    fixtureDir: string,
    configDir: string,
    mnemoConfig: string,
    settings: string | null,
    message: string,
    rawLines: string[],
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
      // accumulator; stamps each event with __t (arrival ms) for phase timing
      const drainLines = () => {
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() ?? "";
        const now = Date.now();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            event.__t = now;
            rawLines.push(JSON.stringify(event));
            accumulator.processEvent(event);
          } catch {
            rawLines.push(line);
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
              const event = JSON.parse(lineBuffer);
              event.__t = Date.now();
              rawLines.push(JSON.stringify(event));
              accumulator.processEvent(event);
            } catch {
              rawLines.push(lineBuffer);
            }
            lineBuffer = "";
          }

          if (code !== 0) {
            const partial = accumulator.finalize();
            const detail = partial.result || stderr || "(no output)";
            reject(new Error(`claude exited with code ${code}: ${detail}`));
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

  /** orchestrates one eval run */

  async callApi(
    prompt: string,
    context: CallApiContext,
  ): Promise<ProviderResponse> {
    this.preflight();

    const { fixture, prime = true, model } = context.vars;
    const { fixtureDir, configDir, mnemoConfig } = this.setup(fixture);
    const rawLines: string[] = [];
    const callIndex = this.callIndex++;

    // snapshot the fixture state AFTER setup (so the .mnemo-config.yml
    // written during setup is in the baseline and won't appear in the diff).
    const beforeSnapshot = this.snapshotDir(fixtureDir);

    try {
      const settings = this.buildSettings(prime);
      const state = await this.execute(
        fixtureDir,
        configDir,
        mnemoConfig,
        settings,
        prompt,
        rawLines,
        model,
      );

      const afterSnapshot = this.snapshotDir(fixtureDir);
      const fsDiff = this.diffSnapshots(beforeSnapshot, afterSnapshot);

      const resolvedModel = state.modelUsage
        ? Object.keys(state.modelUsage)[0]
        : "unknown";
      const usage = state.usage;

      // flatten tool inputs into a searchable blob so assertions can grep
      // "did agent touch X" without caring which tool (Bash/Skill/Read) was
      // used. the blob preserves verb+target substrings like "list notes/cooking"
      // or "load notes/pets/python", so regexes can still distinguish operations.
      const toolInputText = state.toolCalls
        .map((c) => JSON.stringify(c.input ?? {}))
        .join("\n");

      // extract the prompt passed to every sub-agent invocation. used by
      // dispatch-focused tests to assert on the actual brief the dispatcher
      // constructed (destination signal choice, preserved user phrasing,
      // etc.) rather than fuzzing the flattened blob.
      const agentPrompts = state.toolCalls
        .filter((c) => c.input && "subagent_type" in c.input && "prompt" in c.input)
        .map((c) => c.input.prompt as string);

      return {
        output: {
          tool_calls: state.toolCalls,
          tool_input_text: toolInputText,
          agent_prompts: agentPrompts,
          result: state.result,
          final_text: state.finalText,
          files_created: fsDiff.created,
          files_modified: fsDiff.modified,
          files_deleted: fsDiff.deleted,
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
      this.writeTrajectory(callIndex, prompt, rawLines, context.test);
      this.teardown(fixtureDir, configDir);
    }
  }
}
