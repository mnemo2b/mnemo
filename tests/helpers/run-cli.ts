import { resolve, join } from "path";

// project root — two levels up from tests/helpers/
const PROJECT_ROOT = resolve(import.meta.dir, "../..");

// TEST_DIST=1 switches from source (bun src/cli.ts) to built output (node dist/cli.mjs)
const USE_DIST = !!process.env.TEST_DIST;
const ENTRY_POINT = resolve(PROJECT_ROOT, USE_DIST ? "dist/cli.mjs" : "src/cli.ts");
const RUNTIME = USE_DIST ? "node" : "bun";

interface RunOptions {
  home?: string;
  cwd?: string;
  env?: Record<string, string>;
  stdin?: string;
}

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Spawn the CLI as a subprocess and capture output */
export async function runCli(
  args: string[],
  options: RunOptions = {},
): Promise<RunResult> {
  const proc = Bun.spawn([RUNTIME, ENTRY_POINT, ...args], {
    cwd: options.cwd ?? PROJECT_ROOT,
    env: {
      ...process.env,
      ...options.env,
      // override HOME and MNEMO_CONFIG for config isolation when provided
      ...(options.home ? {
        HOME: options.home,
        MNEMO_CONFIG: join(options.home, ".config", "mnemo", "config.yml"),
      } : {}),
    },
    stdin: options.stdin !== undefined ? "pipe" : "inherit",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (options.stdin !== undefined && proc.stdin) {
    proc.stdin.write(options.stdin);
    proc.stdin.end();
  }

  // read streams and wait for exit in parallel
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}
