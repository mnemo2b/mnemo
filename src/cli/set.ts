import { loadConfig, loadProjectConfig, mergeSets, saveConfig } from "../core/config";
import { CLIError } from "../core/errors";
import { resolveSet } from "../core/set";
import { isValidSetName } from "../core/validate-name";
import { DIM, RESET } from "./format";

function setList(): void {
  const { sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());

  const globalNames = Object.keys(globalSets);
  const projectNames = Object.keys(projectSets);

  if (globalNames.length === 0 && projectNames.length === 0) {
    console.log('no sets configured — run "mnemo set add <name> <paths...>"');
    return;
  }

  const allNames = [...new Set([...globalNames, ...projectNames])].sort();

  for (const name of allNames) {
    const inGlobal = name in globalSets;
    const inProject = name in projectSets;
    // project overrides global on collision
    const entries = (inProject ? projectSets[name] : globalSets[name])!;
    const source = inGlobal && inProject ? "project (override)" : inProject ? "project" : "global";

    console.log(`${name} ${DIM}[${source}]${RESET}`);
    for (const entry of entries) {
      console.log(`  ${DIM}${entry}${RESET}`);
    }
  }
}

function setShow(name: string | undefined): void {
  if (!name) {
    throw new CLIError("usage: mnemo set show <name>");
  }

  const { sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const sets = mergeSets(globalSets, projectSets);

  // resolveSet throws on unknown name with a helpful message
  const paths = resolveSet(name, sets);

  for (const path of paths) {
    console.log(path);
  }
}

function setAdd(name: string | undefined, paths: string[]): void {
  if (!name || paths.length === 0) {
    throw new CLIError("usage: mnemo set add <name> <paths...>");
  }

  if (!isValidSetName(name)) {
    throw new CLIError("set name must be lowercase letters, numbers, hyphens, and slashes");
  }

  const { sets } = loadConfig();

  if (sets[name]) {
    // update existing — append new paths, deduplicate
    const existing = new Set(sets[name]);
    let added = 0;
    for (const p of paths) {
      if (!existing.has(p)) {
        existing.add(p);
        added++;
      }
    }
    sets[name] = [...existing];
    saveConfig({ sets });
    console.log(`updated set "${name}" — ${added} path${added !== 1 ? "s" : ""} added (${sets[name].length} total)`);
  } else {
    sets[name] = paths;
    saveConfig({ sets });
    console.log(`created set "${name}" with ${paths.length} path${paths.length !== 1 ? "s" : ""}`);
  }
}

function setRemove(name: string | undefined): void {
  if (!name) {
    throw new CLIError("usage: mnemo set remove <name>");
  }

  const { sets } = loadConfig();

  if (!sets[name]) {
    throw new CLIError(`unknown set: ${name}`);
  }

  delete sets[name];
  saveConfig({ sets });
  console.log(`removed set "${name}"`);
}

export function runSet(args: string[]): void {
  const subcommand = args[0];

  if (subcommand === "list") return setList();
  if (subcommand === "show") return setShow(args[1]);
  if (subcommand === "add") return setAdd(args[1], args.slice(2));
  if (subcommand === "remove") return setRemove(args[1]);

  throw new CLIError("usage: mnemo set <list|show|add|remove>");
}
