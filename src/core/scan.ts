import { readdirSync } from "fs";
import type { Dirent } from "fs";

interface ScanResult {
  dirs: Dirent[];
  files: Dirent[];
}

/** Scan a directory and return sorted dirs and markdown files, skipping hidden entries */
export function scanDirectory(dir: string): ScanResult {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."));

  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { dirs, files };
}
