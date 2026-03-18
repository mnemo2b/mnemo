import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("base commands", () => {
  let home: string;

  beforeAll(() => {
    home = makeTempHome();
  });

  afterAll(() => {
    cleanupTempDir(home);
  });

  test("base list with no bases shows helpful message", async () => {
    const { stdout, exitCode } = await runCli(["base", "list"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("no bases configured");
  });

  test("base add registers a new base", async () => {
    const { stdout, exitCode } = await runCli(
      ["base", "add", "notes", FIXTURES_DIR],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('added base "notes"');
  });

  test("base list shows the added base", async () => {
    const { stdout, exitCode } = await runCli(["base", "list"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("notes:");
  });

  test("base add rejects duplicate name", async () => {
    const { stderr, exitCode } = await runCli(
      ["base", "add", "notes", FIXTURES_DIR],
      { home },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain('failed: base "notes" already exists');
  });

  test("base add rejects invalid name", async () => {
    const { stderr, exitCode } = await runCli(
      ["base", "add", "Bad Name", FIXTURES_DIR],
      { home },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain("lowercase");
  });

  test("base rename updates the name", async () => {
    const { stdout, exitCode } = await runCli(
      ["base", "rename", "notes", "kb"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('renamed base "notes"');

    // verify new name shows in list
    const list = await runCli(["base", "list"], { home });
    expect(list.stdout).toContain("kb:");
    expect(list.stdout).not.toContain("notes:");
  });

  test("base move updates the path", async () => {
    const { stdout, exitCode } = await runCli(
      ["base", "move", "kb", FIXTURES_DIR],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('moved base "kb"');
  });

  test("base remove deletes the base", async () => {
    const { stdout, exitCode } = await runCli(
      ["base", "remove", "kb"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain('removed base "kb"');

    // verify it's gone
    const list = await runCli(["base", "list"], { home });
    expect(list.stdout).toContain("no bases configured");
  });

  test("base with no subcommand shows usage error", async () => {
    const { stderr, exitCode } = await runCli(["base"], { home });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("usage:");
  });
});

describe("base rename updates set paths", () => {
  let home: string;

  beforeAll(() => {
    home = makeTempHome();
    seedConfig(home, {
      bases: { old: FIXTURES_DIR },
      sets: { reading: ["old/topic-a", "old/standalone"] },
    });
  });

  afterAll(() => {
    cleanupTempDir(home);
  });

  test("renaming a base updates paths in sets", async () => {
    const { stdout, exitCode } = await runCli(
      ["base", "rename", "old", "new"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("2 set paths");

    // verify set paths now use the new base name
    const show = await runCli(["set", "show", "reading"], { home, cwd: home });
    expect(show.stdout).toContain("new/topic-a");
    expect(show.stdout).toContain("new/standalone");
    expect(show.stdout).not.toContain("old/");
  });
});
