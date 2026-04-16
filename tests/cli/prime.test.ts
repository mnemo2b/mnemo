import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("prime command", () => {
  test("no bases produces no output", async () => {
    const home = makeTempHome();
    seedConfig(home, { bases: {} });

    const { stdout, exitCode } = await runCli(["prime"], { home, cwd: home });

    expect(exitCode).toBe(0);
    expect(stdout).toBe("");

    cleanupTempDir(home);
  });

  test("bases without sets shows directive, bases, and structure", async () => {
    const home = makeTempHome();
    seedConfig(home, { bases: { notes: FIXTURES_DIR } });

    const { stdout, exitCode } = await runCli(["prime"], { home, cwd: home });

    expect(exitCode).toBe(0);
    // directive
    expect(stdout).toContain("[mnemo]");
    // bases section
    expect(stdout).toContain("bases:");
    expect(stdout).toContain("notes:");
    // no sets section
    expect(stdout).not.toContain("sets:");
    // structure section
    expect(stdout).toContain("structure:");
    expect(stdout).toContain("topic-a/");
    expect(stdout).toContain("topic-b/");

    cleanupTempDir(home);
  });

  test("with sets shows sets and their paths", async () => {
    const home = makeTempHome();
    seedConfig(home, {
      bases: { notes: FIXTURES_DIR },
      sets: {
        reading: ["notes/topic-a"],
        reference: ["notes/standalone"],
      },
    });

    const { stdout, exitCode } = await runCli(["prime"], { home, cwd: home });

    expect(exitCode).toBe(0);
    // sets section
    expect(stdout).toContain("sets bundle related paths");
    expect(stdout).toContain("reading");
    expect(stdout).toContain("reference");
    // paths visible
    expect(stdout).toContain("notes/topic-a");
    expect(stdout).toContain("notes/standalone");
    // source labels
    expect(stdout).toContain("[global]");
    // structure still present
    expect(stdout).toContain("structure:");

    cleanupTempDir(home);
  });
});
