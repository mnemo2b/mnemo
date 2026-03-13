import { readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { loadConfig, loadProjectConfig, mergeSets } from "../core/config";
import { resolveSet } from "../core/sets";
import { resolveBasePath } from "../core/base";
import { parseFrontmatter } from "../core/frontmatter";
import { scanDirectory } from "../core/scan";
import { formatTokens } from "./format";

/** Recursively collect all markdown file paths under a directory */
function collectFiles(dir: string): string[] {
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

/** Count tokens across a list of absolute file paths */
function countTokens(files: string[]): number {
  let total = 0;

  for (const file of files) {
    try {
      const raw = readFileSync(file, "utf-8");
      const { content } = parseFrontmatter(raw, file);
      total += Math.round(content.length / 4);
    } catch {
      // skip files that can't be read
    }
  }

  return total;
}

/** Resolve a base-prefixed path to absolute files */
function resolveToFiles(bases: Record<string, string>, path: string): string[] {
  try {
    const absolute = resolveBasePath(bases, path);
    if (!existsSync(absolute)) return [];
    if (statSync(absolute).isDirectory()) return collectFiles(absolute);
    return [absolute];
  } catch {
    return [];
  }
}

export function runMenu(): void {
  const { bases, sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const allSets = mergeSets(globalSets, projectSets);

  const names = Object.keys(allSets).sort();

  if (names.length === 0) {
    console.log("no sets available");
    return;
  }

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const source = name in projectSets ? "project" : "global";

    // resolve set paths to files and count tokens
    let fileCount = 0;
    let tokens = 0;
    try {
      const paths = resolveSet(name, allSets);
      const seen = new Set<string>();
      const files: string[] = [];

      for (const p of paths) {
        for (const f of resolveToFiles(bases, p)) {
          if (!seen.has(f)) {
            seen.add(f);
            files.push(f);
          }
        }
      }

      fileCount = files.length;
      tokens = countTokens(files);
    } catch {
      // set couldn't be resolved — show it with zero counts
    }

    const num = String(i + 1).padStart(2);
    const noteLabel = fileCount === 1 ? "note" : "notes";
    console.log(`${num}. ${name} — ${fileCount} ${noteLabel}, ${formatTokens(tokens)} tokens [${source}]`);
  }
}
