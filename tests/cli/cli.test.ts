import { describe, expect, test } from "bun:test";
import { runCli } from "../helpers/cli";
import { makeTempHome, cleanupTempDir } from "../helpers/fixtures";

// ----------------------------------------------------------------------------

describe("cli", () => {

  test("--help shows usage and exits 0", async () => {
    const { stdout, exitCode } = await runCli(["--help"]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("usage: mnemo");
    expect(stdout).toContain("commands:");
  });

  test("--version shows version and exits 0", async () => {
    const { stdout, exitCode } = await runCli(["--version"]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("-v shows version and exits 0", async () => {
    const { stdout, exitCode } = await runCli(["-v"]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("no args shows usage and exits 0", async () => {
    const { stdout, exitCode } = await runCli([]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("usage: mnemo");
  });

  test("unknown command shows error on stderr and exits 1", async () => {
    const home = makeTempHome();

    const { stderr, exitCode } = await runCli(["bogus"], { home });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("unknown command: bogus");

    cleanupTempDir(home);
  });

  test("CLIError shows message without stack trace", async () => {
    const home = makeTempHome();

    // "load" with no args triggers a CLIError
    const { stderr, exitCode } = await runCli(["load"], { home });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("usage:");
    // should not contain a stack trace
    expect(stderr).not.toContain("at ");
    expect(stderr).not.toContain("Error:");

    cleanupTempDir(home);
  });

});
