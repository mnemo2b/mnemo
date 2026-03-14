import { describe, expect, test } from "bun:test";
import { parseLoadItems } from "../../src/core/parse-items";

describe("parseLoadItems", () => {
  test("parses a single path", () => {
    expect(parseLoadItems("base/docs/react")).toEqual([
      { type: "path", path: "base/docs/react" },
    ]);
  });

  test("parses a single set reference", () => {
    expect(parseLoadItems(":react")).toEqual([
      { type: "set", name: "react" },
    ]);
  });

  test("parses mixed space-separated input", () => {
    expect(parseLoadItems(":react base/docs/css :python")).toEqual([
      { type: "set", name: "react" },
      { type: "path", path: "base/docs/css" },
      { type: "set", name: "python" },
    ]);
  });

  test("trims and filters extra whitespace", () => {
    expect(parseLoadItems("  :react   base/path  ")).toEqual([
      { type: "set", name: "react" },
      { type: "path", path: "base/path" },
    ]);
  });

  test("returns empty array for empty input", () => {
    expect(parseLoadItems("")).toEqual([]);
  });

  test("returns empty array for whitespace-only input", () => {
    expect(parseLoadItems("   ")).toEqual([]);
  });
});
