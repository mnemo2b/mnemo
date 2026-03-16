import { describe, expect, test } from "bun:test";
import { resolveSet } from "../../src/core/set";
import { CLIError } from "../../src/core/errors";

describe("resolveSet", () => {
  test("resolves a simple set to its paths", () => {
    const sets = {
      react: ["base/docs/react", "base/docs/hooks"],
    };

    expect(resolveSet("react", sets)).toEqual([
      "base/docs/react",
      "base/docs/hooks",
    ]);
  });

  test("resolves nested set references", () => {
    const sets = {
      frontend: [":react", "base/docs/css"],
      react: ["base/docs/react", "base/docs/hooks"],
    };

    expect(resolveSet("frontend", sets)).toEqual([
      "base/docs/react",
      "base/docs/hooks",
      "base/docs/css",
    ]);
  });

  test("resolves 3-deep nesting", () => {
    const sets = {
      all: [":frontend"],
      frontend: [":react"],
      react: ["base/docs/react"],
    };

    expect(resolveSet("all", sets)).toEqual(["base/docs/react"]);
  });

  test("deduplicates paths across composed sets", () => {
    const sets = {
      combined: [":a", ":b"],
      a: ["base/shared", "base/only-a"],
      b: ["base/shared", "base/only-b"],
    };

    expect(resolveSet("combined", sets)).toEqual([
      "base/shared",
      "base/only-a",
      "base/only-b",
    ]);
  });

  test("preserves insertion order", () => {
    const sets = {
      ordered: ["base/third", "base/first", "base/second"],
    };

    expect(resolveSet("ordered", sets)).toEqual([
      "base/third",
      "base/first",
      "base/second",
    ]);
  });

  test("throws CLIError on circular reference", () => {
    const sets = {
      a: [":b"],
      b: [":a"],
    };

    expect(() => resolveSet("a", sets)).toThrow(CLIError);
    expect(() => resolveSet("a", sets)).toThrow(/circular set reference/);
  });

  test("throws CLIError on self-referencing set", () => {
    const sets = {
      loop: [":loop"],
    };

    expect(() => resolveSet("loop", sets)).toThrow(/circular set reference/);
  });

  test("throws CLIError on unknown set with available-sets hint", () => {
    const sets = {
      react: ["base/docs/react"],
      python: ["base/docs/python"],
    };

    expect(() => resolveSet("nonexistent", sets)).toThrow(CLIError);
    expect(() => resolveSet("nonexistent", sets)).toThrow(/unknown set: "nonexistent"/);
    expect(() => resolveSet("nonexistent", sets)).toThrow(/sets:/);
  });

  test("throws CLIError on unknown set with no hint when no sets exist", () => {
    expect(() => resolveSet("anything", {})).toThrow(/unknown set: "anything"/);
    // should not include "sets:" list when there are none
    try {
      resolveSet("anything", {});
    } catch (e) {
      expect((e as Error).message).not.toContain("sets:");
    }
  });
});
