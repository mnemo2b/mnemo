import { readdirSync } from "fs";
import { join } from "path";
import type { Dirent } from "fs";

// -----------------------------------------------------------------------------

interface ScanResult {
  dirs: Dirent[];
  files: Dirent[];
}

// -----------------------------------------------------------------------------

/** scan a directory and return sorted dirs and markdown files, skipping hidden entries */

export function scanDirectory(dir: string): ScanResult {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith(".") && e.name !== "AGENTS.md");

  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { dirs, files };
}

/** recursively collect all markdown file paths under a directory */

export function collectFiles(dir: string): string[] {
  const { dirs, files } = scanDirectory(dir);
  const paths: string[] = [];

  for (const f of files) {
    paths.push(join(dir, f.name));
  }

  for (const d of dirs) {
    paths.push(...collectFiles(join(dir, d.name)));
  }

  return paths;
}
