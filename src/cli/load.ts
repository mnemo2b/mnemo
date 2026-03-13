import { statSync, existsSync } from "fs";
import { loadConfig, loadProjectConfig, mergeSets } from "../core/config";
import { resolveBasePath } from "../core/base";
import { resolveSet } from "../core/sets";
import { parseLoadItems } from "../core/parse-items";
import { scanDirectory } from "../core/scan";
import { resolvePath } from "../core/resolve-path";
import { join } from "path";

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

/** Resolve a single base-prefixed path to one or more absolute file paths */
export function resolveToFiles(bases: Record<string, string>, path: string): string[] {
  const absolute = resolveBasePath(bases, path);

  if (!existsSync(absolute)) {
    console.error(`warning: path not found: ${path}`);
    return [];
  }

  if (statSync(absolute).isDirectory()) {
    return collectFiles(absolute);
  }

  return [absolute];
}

export function runLoad(args: string[]): void {
  const input = args.join(" ").trim();

  if (!input) {
    console.error("usage: mnemo load <path|:set|mixed,...>");
    process.exit(1);
  }

  const { bases, sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const sets = mergeSets(globalSets, projectSets);

  const items = parseLoadItems(input);
  const seen = new Set<string>();
  const result: string[] = [];

  function add(path: string): void {
    if (!seen.has(path)) {
      seen.add(path);
      result.push(path);
    }
  }

  for (const item of items) {
    if (item.type === "set") {
      // resolve set to base-prefixed paths, then each to files
      const paths = resolveSet(item.name, sets);
      for (const p of paths) {
        for (const file of resolveToFiles(bases, p)) {
          add(file);
        }
      }
    } else {
      // direct base-prefixed path
      for (const file of resolveToFiles(bases, item.path)) {
        add(file);
      }
    }
  }

  for (const path of result) {
    console.log(path);
  }
}
