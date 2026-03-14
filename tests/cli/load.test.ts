import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("load command", () => {
  let home: string;

  beforeAll(() => {
    home = makeTempHome();
    seedConfig(home, {
      bases: { notes: FIXTURES_DIR },
      sets: {
        reading: ["notes/topic-a", "notes/standalone"],
        overlap: ["notes/topic-a", "notes/topic-b"],
      },
    });
  });

  afterAll(() => {
    cleanupTempDir(home);
  });

  test("single file path outputs one absolute path", async () => {
    const { stdout, exitCode } = await runCli(
      ["load", "notes/standalone"],
      { home, cwd: home },
    );

    expect(exitCode).toBe(0);
    const lines = stdout.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEndWith("standalone.md");
  });

  test("directory path outputs all .md files recursively", async () => {
    const { stdout, exitCode } = await runCli(
      ["load", "notes/topic-a"],
      { home, cwd: home },
    );

    expect(exitCode).toBe(0);
    const lines = stdout.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines.some((l) => l.endsWith("note-1.md"))).toBe(true);
    expect(lines.some((l) => l.endsWith("note-2.md"))).toBe(true);
  });

  test("set reference outputs resolved file paths", async () => {
    const { stdout, exitCode } = await runCli(
      ["load", ":reading"],
      { home, cwd: home },
    );

    expect(exitCode).toBe(0);
    const lines = stdout.split("\n");
    // topic-a has 2 files + standalone has 1 = 3
    expect(lines).toHaveLength(3);
  });

  test("mixed input deduplicates", async () => {
    // :reading includes notes/topic-a, and we also pass it directly
    const { stdout, exitCode } = await runCli(
      ["load", ":reading", "notes/topic-a"],
      { home, cwd: home },
    );

    expect(exitCode).toBe(0);
    const lines = stdout.split("\n");
    // should still be 3, not 5 (topic-a files aren't duplicated)
    expect(lines).toHaveLength(3);
  });

  test("missing path shows warning on stderr but continues", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["load", "notes/nonexistent", "notes/standalone"],
      { home, cwd: home },
    );

    expect(exitCode).toBe(0);
    expect(stderr).toContain("warning:");
    expect(stderr).toContain("nonexistent");
    // should still output the valid path
    expect(stdout).toContain("standalone.md");
  });

  test("no args shows usage error", async () => {
    const { stderr, exitCode } = await runCli(["load"], { home });

    expect(exitCode).toBe(1);
    expect(stderr).toContain("usage:");
  });
});
