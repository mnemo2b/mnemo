import { describe, expect, test } from "bun:test";
import { isValidName, isValidSetName } from "../../src/core/validate-name";

describe("isValidName", () => {
  test.each(["personal", "my-notes", "work2", "a", "notes-123"])
    ("accepts valid base name: %s", (name) => {
      expect(isValidName(name)).toBe(true);
    });

  test.each(["My Notes", "personal/sub", "", "_hidden", "UPPER", "has space", "with.dot"])
    ("rejects invalid base name: %s", (name) => {
      expect(isValidName(name)).toBe(false);
    });
});

describe("isValidSetName", () => {
  test.each(["react", "code/react", "work/onboarding/week-1", "a/b/c"])
    ("accepts valid set name: %s", (name) => {
      expect(isValidSetName(name)).toBe(true);
    });

  test.each(["UPPER", "trailing/", "/leading", "double//slash", "", "has space", "with.dot"])
    ("rejects invalid set name: %s", (name) => {
      expect(isValidSetName(name)).toBe(false);
    });
});
