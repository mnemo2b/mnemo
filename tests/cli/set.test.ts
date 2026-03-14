import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("set commands", () => {
  let home: string;

  beforeAll(() => {
    home = makeTempHome();
    // seed with a base so set paths have something to resolve against
    seedConfig(home, { bases: { notes: FIXTURES_DIR } });
  });

  afterAll(() => {
    cleanupTempDir(home);
  });

  test("set list with no sets shows helpful message", async () => {
    // cwd = home so we don't pick up the project's .mnemo file
    const { stdout, exitCode } = await runCli(["set", "list"], { home, cwd: home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("no sets configured");
  });

  test("set add creates a new set", async () => {
    const { stdout, exitCode } = await runCli(
      ["set", "add", "reading", "notes/topic-a", "notes/standalone"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('created set "reading"');
    expect(stdout).toContain("2 paths");
  });

  test("set add to existing set appends and deduplicates", async () => {
    const { stdout, exitCode } = await runCli(
      // notes/topic-a already exists, notes/topic-b is new
      ["set", "add", "reading", "notes/topic-a", "notes/topic-b"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("1 path added");
    expect(stdout).toContain("3 total");
  });

  test("set show displays the paths in a set", async () => {
    const { stdout, exitCode } = await runCli(
      ["set", "show", "reading"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("notes/topic-a");
    expect(stdout).toContain("notes/standalone");
    expect(stdout).toContain("notes/topic-b");
  });

  test("set list shows all sets with source labels", async () => {
    const { stdout, exitCode } = await runCli(["set", "list"], { home, cwd: home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("reading");
    expect(stdout).toContain("[global]");
  });

  test("set add rejects invalid name", async () => {
    const { stderr, exitCode } = await runCli(
      ["set", "add", "Bad Name", "notes/topic-a"],
      { home },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain("lowercase");
  });

  test("set remove deletes a set", async () => {
    const { stdout, exitCode } = await runCli(
      ["set", "remove", "reading"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('removed set "reading"');

    // verify it's gone
    const list = await runCli(["set", "list"], { home, cwd: home });
    expect(list.stdout).toContain("no sets configured");
  });

  test("set remove on unknown set shows error", async () => {
    const { stderr, exitCode } = await runCli(
      ["set", "remove", "nonexistent"],
      { home },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain("unknown set");
  });

  test("set with no subcommand shows usage error", async () => {
    const { stderr, exitCode } = await runCli(["set"], { home });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("usage:");
  });
});
