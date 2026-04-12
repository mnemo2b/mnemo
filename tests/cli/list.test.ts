import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("list command", () => {
  let home: string;

  beforeAll(() => {
    home = makeTempHome();
    seedConfig(home, {
      bases: { notes: FIXTURES_DIR },
    });
  });

  afterAll(() => {
    cleanupTempDir(home);
  });

  test("no bases configured shows error", async () => {
    const emptyHome = makeTempHome();
    const { stderr, exitCode } = await runCli(["list"], { home: emptyHome });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("no bases configured");

    cleanupTempDir(emptyHome);
  });

  test("no path shows all bases as tree", async () => {
    const { stdout, exitCode } = await runCli(["list"], { home });

    expect(exitCode).toBe(0);
    // should show the base name and subdirectories
    expect(stdout).toContain("notes");
    expect(stdout).toContain("topic-a");
    expect(stdout).toContain("topic-b");
    // should show tree connectors
    expect(stdout).toMatch(/[├└]/);
    // should show summary line
    expect(stdout).toMatch(/\d+ directories, \d+ files/);
  });

  test("specific path shows subtree", async () => {
    const { stdout, exitCode } = await runCli(
      ["list", "notes/topic-a"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("note-1.md");
    expect(stdout).toContain("note-2.md");
    // should not show topic-b
    expect(stdout).not.toContain("topic-b");
  });

  test("unknown base shows error with available bases", async () => {
    const { stderr, exitCode } = await runCli(
      ["list", "nonexistent"],
      { home },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain('unknown base: "nonexistent"');
    expect(stderr).toContain("bases:");
    expect(stderr).toContain("notes:");
  });

  test("nonexistent path within valid base shows error", async () => {
    const { stderr, exitCode } = await runCli(
      ["list", "notes/does-not-exist"],
      { home },
    );

    expect(exitCode).toBe(1);
    expect(stderr).toContain("nothing found");
  });

  test("--depth 0 shows directories without children", async () => {
    const { stdout, exitCode } = await runCli(
      ["list", "--depth", "0"],
      { home },
    );

    expect(exitCode).toBe(0);
    // should show top-level directories
    expect(stdout).toContain("topic-a");
    expect(stdout).toContain("topic-b");
    // should not show files inside directories
    expect(stdout).not.toContain("note-1.md");
    expect(stdout).not.toContain("note-3.md");
    // should still show top-level files
    expect(stdout).toContain("standalone.md");
    // token counts should still be accurate (full recursion)
    expect(stdout).toMatch(/tokens/);
  });

  test("--depth 1 shows one level of children", async () => {
    const { stdout, exitCode } = await runCli(
      ["list", "--depth", "1"],
      { home },
    );

    expect(exitCode).toBe(0);
    // should show files inside directories
    expect(stdout).toContain("note-1.md");
    expect(stdout).toContain("note-3.md");
  });

  test("--no-tokens omits token counts", async () => {
    const { stdout, exitCode } = await runCli(
      ["list", "--no-tokens"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("topic-a");
    // summary line should not include tokens
    expect(stdout).not.toContain("tokens");
  });

  test("--depth and --no-tokens combine", async () => {
    const { stdout, exitCode } = await runCli(
      ["list", "--depth", "0", "--no-tokens"],
      { home },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("topic-a");
    expect(stdout).not.toContain("note-1.md");
    expect(stdout).not.toContain("tokens");
  });
});
