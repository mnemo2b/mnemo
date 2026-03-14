import { loadConfig, loadProjectConfig, mergeSets } from "../core/config";
import { CLIError } from "../core/errors";
import { resolveToFiles } from "../core/base";
import { resolveSet } from "../core/set";
import { parseLoadItems } from "../core/parse-items";

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
        const files = resolveToFiles(bases, p);
        if (files.length === 0) {
          console.error(`warning: path not found: ${p}`);
        }
        for (const file of files) {
          add(file);
        }
      }
    } else {
      // direct base-prefixed path
      const files = resolveToFiles(bases, item.path);
      if (files.length === 0) {
        console.error(`warning: path not found: ${item.path}`);
      }
      for (const file of files) {
        add(file);
      }
    }
  }

  for (const path of result) {
    console.log(path);
  }
}
