import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("menu command", () => {
  test("no sets produces no output", async () => {
    const home = makeTempHome();
    seedConfig(home, { bases: { notes: FIXTURES_DIR } });

    const { stdout, exitCode } = await runCli(["menu"], { home, cwd: home });

    expect(exitCode).toBe(0);
    expect(stdout).toBe("");

    cleanupTempDir(home);
  });

  test("shows numbered list with note counts and token sizes", async () => {
    const home = makeTempHome();
    seedConfig(home, {
      bases: { notes: FIXTURES_DIR },
      sets: {
        reading: ["notes/topic-a"],
        reference: ["notes/standalone"],
      },
    });

    const { stdout, exitCode } = await runCli(["menu"], { home, cwd: home });

    expect(exitCode).toBe(0);
    // numbered entries
    expect(stdout).toContain("1.");
    expect(stdout).toContain("2.");
    // set names present
    expect(stdout).toContain("reading");
    expect(stdout).toContain("reference");
    // note counts
    expect(stdout).toMatch(/\d+ notes?/);
    // token counts
    expect(stdout).toMatch(/\d+\s+tokens/);
    // source labels
    expect(stdout).toContain("[global]");

    cleanupTempDir(home);
  });
});
