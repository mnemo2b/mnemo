import { existsSync } from "fs";
import { join } from "path";
import { loadConfig, loadProjectConfig, mergeSets } from "../core/config";
import { resolveBasePath } from "../core/base";
import { resolveSet } from "../core/sets";
import { parseLoadItems } from "../core/parse-items";
import { resolveToFiles } from "./load";

export function runInit(): void {
  const cwd = process.cwd();
  const configPath = join(cwd, ".mnemo");

  // no .mnemo file — silent exit, not an error
  if (!existsSync(configPath)) {
    return;
  }

  const { bases, sets: globalSets } = loadConfig();
  const project = loadProjectConfig(cwd);
  const sets = mergeSets(globalSets, project.sets);

  if (project.load.length === 0) {
    return;
  }

  // the load entries use the same syntax as CLI load input
  const input = project.load.join(", ");
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
      const paths = resolveSet(item.name, sets);
      for (const p of paths) {
        for (const file of resolveToFiles(bases, p)) {
          add(file);
        }
      }
    } else {
      for (const file of resolveToFiles(bases, item.path)) {
        add(file);
      }
    }
  }

  for (const path of result) {
    console.log(path);
  }
}
