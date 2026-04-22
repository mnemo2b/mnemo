import { describe, expect, test } from "bun:test";
import { formatBasesHint } from "@/core/base";
import { formatSetsHint } from "@/core/set";

describe("formatBasesHint", () => {
  test("returns empty string when no bases", () => {
    expect(formatBasesHint({})).toBe("");
  });

  test("formats a single base", () => {
    const result = formatBasesHint({ notes: "/Users/neil/notes" });
    expect(result).toContain("bases:");
    expect(result).toContain("notes:");
  });

  test("sorts bases alphabetically", () => {
    const result = formatBasesHint({
      work: "/tmp/work",
      personal: "/tmp/personal",
      archive: "/tmp/archive",
    });

    const lines = result.split("\n").filter((l) => l.startsWith("  "));
    const names = lines.map((l) => l.trim().split(":")[0]);
    expect(names).toEqual(["archive", "personal", "work"]);
  });

  test("shortens home directory to ~", () => {
    const home = process.env.HOME!;
    const result = formatBasesHint({ notes: `${home}/notes` });
    expect(result).toContain("~/notes");
  });

  test("starts with double newline for error message spacing", () => {
    const result = formatBasesHint({ notes: "/tmp/notes" });
    expect(result).toStartWith("\n\n");
  });
});

describe("formatSetsHint", () => {
  test("returns empty string when no sets", () => {
    expect(formatSetsHint({})).toBe("");
  });

  test("formats a single set", () => {
    const result = formatSetsHint({ react: ["base/react"] });
    expect(result).toContain("sets:");
    expect(result).toContain("react");
  });

  test("sorts sets alphabetically", () => {
    const result = formatSetsHint({
      zsh: ["base/zsh"],
      aws: ["base/aws"],
      node: ["base/node"],
    });

    const lines = result.split("\n").filter((l) => l.startsWith("  "));
    const names = lines.map((l) => l.trim());
    expect(names).toEqual(["aws", "node", "zsh"]);
  });

  test("starts with double newline for error message spacing", () => {
    const result = formatSetsHint({ react: ["base/react"] });
    expect(result).toStartWith("\n\n");
  });
});
