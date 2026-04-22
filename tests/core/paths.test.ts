import { describe, expect, test } from "bun:test";
import { join } from "path";
import { homedir } from "os";
import { expandPath, resolvePath, shortenPath } from "@/core/paths";
import { FIXTURES_DIR } from "../helpers/fixtures";

describe("expandPath", () => {
  const home = homedir();

  test("expands ~ to home directory", () => {
    expect(expandPath("~/projects/mnemo")).toBe(`${home}/projects/mnemo`);
  });

  test("resolves relative paths to absolute", () => {
    const result = expandPath("relative/path");

    expect(result).toMatch(/^\//);
    expect(result).toEndWith("relative/path");
  });

  test("leaves absolute paths unchanged", () => {
    expect(expandPath("/usr/local/bin")).toBe("/usr/local/bin");
  });
});

describe("resolvePath", () => {
  test("returns exact path when file exists", () => {
    const result = resolvePath(FIXTURES_DIR, "standalone.md");

    expect(result).toBe(join(FIXTURES_DIR, "standalone.md"));
  });

  test("appends .md when exact path doesn't exist", () => {
    // "standalone" doesn't exist, but "standalone.md" does
    const result = resolvePath(FIXTURES_DIR, "standalone");

    expect(result).toBe(join(FIXTURES_DIR, "standalone.md"));
  });

  test("returns exact path when neither exists", () => {
    // when neither "nonexistent" nor "nonexistent.md" exist,
    // the function returns the exact (unmodified) path
    const result = resolvePath(FIXTURES_DIR, "nonexistent");

    expect(result).toBe(join(FIXTURES_DIR, "nonexistent"));
  });

  test("returns directory path when it exists", () => {
    const result = resolvePath(FIXTURES_DIR, "topic-a");

    expect(result).toBe(join(FIXTURES_DIR, "topic-a"));
  });
});

describe("shortenPath", () => {
  const home = homedir();

  test("replaces home directory with ~", () => {
    expect(shortenPath(`${home}/projects/mnemo`)).toBe("~/projects/mnemo");
  });

  test("leaves non-home paths unchanged", () => {
    expect(shortenPath("/usr/local/bin")).toBe("/usr/local/bin");
  });

  test("handles exact home directory", () => {
    expect(shortenPath(home)).toBe("~");
  });
});
