import { describe, expect, test } from "bun:test";
import { parseFrontmatter } from "../../src/core/frontmatter";

describe("parseFrontmatter", () => {
  test("extracts title and description from valid frontmatter", () => {
    const raw = `---
title: My Note
description: A test note
---

# My Note

Content here.`;

    const result = parseFrontmatter(raw);

    expect(result.title).toBe("My Note");
    expect(result.description).toBe("A test note");
    // blank line between --- and content is preserved
    expect(result.content).toBe("\n# My Note\n\nContent here.");
  });

  test("extracts title when description is missing", () => {
    const raw = `---
title: Title Only
---

Some content.`;

    const result = parseFrontmatter(raw);

    expect(result.title).toBe("Title Only");
    expect(result.description).toBeNull();
  });

  test("returns content without frontmatter block", () => {
    const raw = `---
title: Test
description: Desc
---

The actual content.`;

    const result = parseFrontmatter(raw);

    expect(result.content).toBe("\nThe actual content.");
  });

  test("handles file with no frontmatter", () => {
    const raw = "# Just a heading\n\nSome content without frontmatter.";

    const result = parseFrontmatter(raw, "/path/to/my-note.md");

    expect(result.title).toBe("My Note");
    expect(result.description).toBeNull();
    expect(result.content).toBe(raw);
  });

  test("handles file with opening --- but no closing delimiter", () => {
    const raw = "---\ntitle: Unclosed\nThis is not valid frontmatter";

    const result = parseFrontmatter(raw, "/path/to/fallback.md");

    // no closing ---, so treat whole file as content
    expect(result.title).toBe("Fallback");
    expect(result.content).toBe(raw);
  });

  test("handles malformed YAML in frontmatter", () => {
    const raw = `---
title: [unclosed bracket
---

Content after bad yaml.`;

    const result = parseFrontmatter(raw, "/path/to/rescue.md");

    // malformed yaml falls back to filename title
    expect(result.title).toBe("Rescue");
    expect(result.description).toBeNull();
    expect(result.content).toBe(raw);
  });

  test("generates title from filename when no frontmatter", () => {
    const result = parseFrontmatter("plain text", "/notes/my-cool-note.md");
    expect(result.title).toBe("My Cool Note");
  });

  test("returns null title when no frontmatter and no filepath", () => {
    const result = parseFrontmatter("plain text");
    expect(result.title).toBeNull();
  });

  test("strips one leading newline after closing delimiter", () => {
    // ---\ntitle: Test\n---\nContent — only one \n after closing ---
    const raw = "---\ntitle: Test\n---\nContent starts here.";

    const result = parseFrontmatter(raw);

    // the single \n after --- is stripped, content starts immediately
    expect(result.content).toBe("Content starts here.");
  });

  test("preserves blank line between frontmatter and content", () => {
    // ---\ntitle: Test\n---\n\nContent — two \n after closing ---
    const raw = "---\ntitle: Test\n---\n\nContent starts here.";

    const result = parseFrontmatter(raw);

    // one \n stripped, the blank line remains
    expect(result.content).toBe("\nContent starts here.");
  });
});
