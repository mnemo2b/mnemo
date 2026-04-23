import { loadConfig, loadProjectConfig } from "@/core/config";
import { CLIError } from "@/core/errors";
import { resolveToFiles } from "@/core/base";
import { mergeSets, resolveSet } from "@/core/set";

// -----------------------------------------------------------------------------

type LoadItem =
  | { type: "set"; name: string }
  | { type: "path"; path: string };

// -----------------------------------------------------------------------------

/** resolves paths/sets to files and prints to stdout */

export function runLoad(args: string[]): void {
  const input = args.join(" ").trim();

  if (!input) {
    throw new CLIError("usage: mnemo load <path|:set|mixed,...>");
  }

  const { bases, sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const sets = mergeSets(globalSets, projectSets);

  const items = parseLoadItems(input);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    if (item.type === "set") {
      for (const p of resolveSet(item.name, sets)) {
        resolveAndAdd(p);
      }
    } else {
      resolveAndAdd(item.path);
    }
  }

  for (const path of result) {
    console.log(path);
  }

  /** resolves a base-prefixed path to files */

  function resolveAndAdd(path: string): void {
    const files = resolveToFiles(bases, path);

    if (files.length === 0) {
      console.error(`warning: path not found: ${path}`);
    }

    for (const file of files) {
      if (!seen.has(file)) {
        seen.add(file);
        result.push(file);
      }
    }
  }
}

/** parse space-separated input into structured load items */

export function parseLoadItems(input: string): LoadItem[] {
  return input
    .split(/\s+/)
    .filter((s) => s.length > 0)
    .map((s) => {
      if (s.startsWith(":")) {
        return { type: "set", name: s.slice(1) };
      }
      return { type: "path", path: s };
    });
}
