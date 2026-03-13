import { loadConfig, loadProjectConfig, mergeSets, saveConfig } from "../core/config";
import { resolveSet } from "../core/sets";
import { isValidName } from "../core/validate-name";
import { DIM, RESET } from "./format";

export function runSet(args: string[]): void {
  const subcommand = args[0];

  // ---------------------------------------------------------------------------

  if (subcommand === "list") {
    const { sets: globalSets } = loadConfig();
    const { sets: projectSets } = loadProjectConfig(process.cwd());

    const globalNames = Object.keys(globalSets);
    const projectNames = Object.keys(projectSets);

    if (globalNames.length === 0 && projectNames.length === 0) {
      console.log('no sets configured — run "mnemo set add <name> <paths...>"');
      process.exit(0);
    }

    const allNames = [...new Set([...globalNames, ...projectNames])].sort();

    for (const name of allNames) {
      const inGlobal = name in globalSets;
      const inProject = name in projectSets;
      // project overrides global on collision
      const entries = inProject ? projectSets[name] : globalSets[name];
      const source = inGlobal && inProject ? "project (override)" : inProject ? "project" : "global";

      console.log(`${name} ${DIM}[${source}]${RESET}`);
      for (const entry of entries) {
        console.log(`  ${DIM}${entry}${RESET}`);
      }
    }
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "show") {
    const name = args[1];

    if (!name) {
      console.error("usage: mnemo set show <name>");
      process.exit(1);
    }

    const { sets: globalSets } = loadConfig();
    const { sets: projectSets } = loadProjectConfig(process.cwd());
    const sets = mergeSets(globalSets, projectSets);

    // resolveSet throws on unknown name with a helpful message
    const paths = resolveSet(name, sets);

    for (const path of paths) {
      console.log(path);
    }
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "add") {
    const name = args[1];
    const paths = args.slice(2);

    if (!name || paths.length === 0) {
      console.error("usage: mnemo set add <name> <paths...>");
      process.exit(1);
    }

    if (!isValidName(name)) {
      console.error("set name must be lowercase letters, numbers, and hyphens");
      process.exit(1);
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
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "remove") {
    const name = args[1];

    if (!name) {
      console.error("usage: mnemo set remove <name>");
      process.exit(1);
    }

    const { sets } = loadConfig();

    if (!sets[name]) {
      console.error(`unknown set: ${name}`);
      process.exit(1);
    }

    delete sets[name];
    saveConfig({ sets });
    console.log(`removed set "${name}"`);
    return;
  }

  // ---------------------------------------------------------------------------

  console.error("usage: mnemo set <list|show|add|remove>");
  process.exit(1);
}
