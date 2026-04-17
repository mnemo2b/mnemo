// custom grader for promptfoo's llm-rubric assertions. shells out to
// `claude -p` so we use the same oauth path as the dispatch provider
// instead of requiring a separate anthropic_api_key. promptfoo sends a
// rubric prompt asking for json {pass, score, reason}; claude replies with
// that json and we pass it through.
//
// --bare mode would isolate more aggressively but forces api-key auth only,
// so we run normal mode with an empty claude_config_dir and a scratch cwd
// to suppress skill auto-load and claude.md auto-discovery.

import { spawn } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

//-----------------------------------------------------------------------------

interface ProviderOptions {
  id?: string;
  config?: {
    model?: string;
    timeoutMs?: number;
  };
}

interface ProviderResponse {
  output?: string;
  error?: string;
}

//-----------------------------------------------------------------------------

export default class GraderProvider {
  private model: string;
  private timeoutMs: number;

  constructor(options: ProviderOptions = {}) {
    this.model = options.config?.model ?? "sonnet";
    this.timeoutMs = options.config?.timeoutMs ?? 60_000;
  }

  id() {
    return "grader";
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    return new Promise<ProviderResponse>((resolve) => {
      const configDir = mkdtempSync(join(tmpdir(), "mnemo-grader-config-"));
      const cwd = mkdtempSync(join(tmpdir(), "mnemo-grader-cwd-"));

      const cleanup = () => {
        rmSync(configDir, { recursive: true, force: true });
        rmSync(cwd, { recursive: true, force: true });
      };

      const args = [
        "-p",
        "--model", this.model,
        "--permission-mode", "bypassPermissions",
        "--output-format", "text",
        prompt,
      ];

      const proc = spawn("claude", args, {
        cwd,
        env: { ...process.env, CLAUDE_CONFIG_DIR: configDir },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let settled = false;

      const settle = (response: ProviderResponse) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(response);
      };

      proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on("error", (err) => {
        settle({ error: `grader spawn failed: ${err.message}` });
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          settle({ error: `grader exited with code ${code}: ${stderr || "(no stderr)"}` });
          return;
        }
        // extract the outermost {...} block — claude sometimes wraps json in prose
        const match = stdout.match(/\{[\s\S]*\}/);
        settle({ output: match ? match[0] : stdout });
      });

      const timer = setTimeout(() => {
        proc.kill("SIGTERM");
        setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 2000);
        settle({ error: `grader timed out after ${this.timeoutMs}ms` });
      }, this.timeoutMs);
    });
  }
}
