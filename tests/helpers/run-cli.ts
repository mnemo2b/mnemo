import { resolve } from "path";

// project root — two levels up from tests/helpers/
const PROJECT_ROOT = resolve(import.meta.dir, "../..");
const ENTRY_POINT = resolve(PROJECT_ROOT, "src/cli.ts");

interface RunOptions {
  home?: string;
  cwd?: string;
  env?: Record<string, string>;
}

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Spawn `bun src/cli.ts` with args and capture output */
export async function runCli(
  args: string[],
  options: RunOptions = {},
): Promise<RunResult> {
  const proc = Bun.spawn(["bun", ENTRY_POINT, ...args], {
    cwd: options.cwd ?? PROJECT_ROOT,
    env: {
      ...process.env,
      ...options.env,
      // override HOME for config isolation when provided
      ...(options.home ? { HOME: options.home } : {}),
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  // read streams and wait for exit in parallel
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}
