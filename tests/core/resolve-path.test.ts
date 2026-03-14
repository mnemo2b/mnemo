import { describe, expect, test } from "bun:test";
import { join } from "path";
import { resolvePath } from "../../src/core/resolve-path";
import { FIXTURES_DIR } from "../helpers/fixtures";

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
