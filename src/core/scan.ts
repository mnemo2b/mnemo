import { readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import type { Dirent } from "fs";
import { resolveBasePath } from "./base";

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

/** Recursively collect all markdown file paths under a directory */
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

/** Resolve a base-prefixed path to absolute file paths, returns [] if not found */
export function resolveToFiles(bases: Record<string, string>, path: string): string[] {
  const absolute = resolveBasePath(bases, path);

  if (!existsSync(absolute)) return [];
  if (statSync(absolute).isDirectory()) return collectFiles(absolute);
  return [absolute];
}
