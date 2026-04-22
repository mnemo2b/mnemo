import { describe, expect, test } from "bun:test";
import { join } from "path";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { scanDirectory, collectFiles } from "@/core/scan";
import { FIXTURES_DIR } from "../helpers/fixtures";

// ----------------------------------------------------------------------------

describe("collectFiles", () => {

  test("recursively collects all .md file paths", () => {
    const result = collectFiles(FIXTURES_DIR);

    // should find: topic-a/note-1.md, topic-a/note-2.md, topic-b/note-3.md, standalone.md
    // should NOT find: .hidden/ignored.md
    expect(result).toHaveLength(4);
    expect(result.some((f) => f.endsWith("note-1.md"))).toBe(true);
    expect(result.some((f) => f.endsWith("note-2.md"))).toBe(true);
    expect(result.some((f) => f.endsWith("note-3.md"))).toBe(true);
    expect(result.some((f) => f.endsWith("standalone.md"))).toBe(true);
  });

  test("returns absolute paths", () => {
    const result = collectFiles(FIXTURES_DIR);

    for (const path of result) {
      expect(path.startsWith("/")).toBe(true);
    }
  });

  test("returns empty array for empty directory", () => {
    const tmp = mkdtempSync(join(tmpdir(), "empty-test-"));

    expect(collectFiles(tmp)).toEqual([]);

    rmSync(tmp, { recursive: true });
  });

});

describe("scanDirectory", () => {

  test("returns sorted dirs and markdown files", () => {
    const { dirs, files } = scanDirectory(FIXTURES_DIR);
    const dirNames = dirs.map((d) => d.name);
    const fileNames = files.map((f) => f.name);

    // should find topic-a and topic-b (sorted), but not .hidden
    expect(dirNames).toEqual(["topic-a", "topic-b"]);
    // should find standalone.md at root
    expect(fileNames).toEqual(["standalone.md"]);
  });

  test("skips hidden entries", () => {
    const { dirs, files } = scanDirectory(FIXTURES_DIR);
    const allNames = [
      ...dirs.map((d) => d.name),
      ...files.map((f) => f.name),
    ];

    expect(allNames.every((n) => !n.startsWith("."))).toBe(true);
  });

  test("ignores non-.md files", () => {
    // create a temp dir with mixed file types
    const tmp = mkdtempSync(join(tmpdir(), "scan-test-"));
    writeFileSync(join(tmp, "note.md"), "# test");
    writeFileSync(join(tmp, "readme.txt"), "text");
    writeFileSync(join(tmp, "data.json"), "{}");

    const { files } = scanDirectory(tmp);
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe("note.md");

    rmSync(tmp, { recursive: true });
  });

});
