import { describe, expect, test } from "bun:test";
import { parseBasePath, resolveBasePath, resolveToFiles } from "../../src/core/base";
import { CLIError } from "../../src/core/errors";
import { FIXTURES_DIR } from "../helpers/fixtures";

describe("parseBasePath", () => {
  test("splits base/relative into parts", () => {
    expect(parseBasePath("personal/code/react")).toEqual({
      baseName: "personal",
      relativePath: "code/react",
    });
  });

  test("handles base-only input (no slash)", () => {
    expect(parseBasePath("personal")).toEqual({
      baseName: "personal",
      relativePath: null,
    });
  });

  test("handles deeply nested path", () => {
    expect(parseBasePath("base/a/b/c/d")).toEqual({
      baseName: "base",
      relativePath: "a/b/c/d",
    });
  });
});

describe("resolveBasePath", () => {
  const bases = { notes: FIXTURES_DIR };

  test("returns base root when no relative path", () => {
    expect(resolveBasePath(bases, "notes")).toBe(FIXTURES_DIR);
  });

  test("resolves relative path within base", () => {
    const result = resolveBasePath(bases, "notes/topic-a");
    expect(result).toContain("topic-a");
  });

  test("resolves file with .md fallback", () => {
    // "notes/standalone" should resolve to "standalone.md"
    const result = resolveBasePath(bases, "notes/standalone");
    expect(result).toEndWith("standalone.md");
  });

  test("throws CLIError on unknown base with hint", () => {
    expect(() => resolveBasePath(bases, "nonexistent/path")).toThrow(CLIError);
    expect(() => resolveBasePath(bases, "nonexistent/path")).toThrow(
      /unknown base: "nonexistent"/,
    );
    expect(() => resolveBasePath(bases, "nonexistent/path")).toThrow(/bases:/);
  });
});

describe("resolveToFiles", () => {
  const bases = { notes: FIXTURES_DIR };

  test("returns single file path for a file", () => {
    const result = resolveToFiles(bases, "notes/standalone");
    expect(result).toHaveLength(1);
    expect(result[0]).toEndWith("standalone.md");
  });

  test("returns all .md files recursively for a directory", () => {
    const result = resolveToFiles(bases, "notes/topic-a");
    expect(result).toHaveLength(2);
    expect(result.some((f) => f.endsWith("note-1.md"))).toBe(true);
    expect(result.some((f) => f.endsWith("note-2.md"))).toBe(true);
  });

  test("returns empty array for nonexistent path", () => {
    const result = resolveToFiles(bases, "notes/does-not-exist");
    expect(result).toEqual([]);
  });
});
