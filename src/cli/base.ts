import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { loadConfig, saveConfig, shortenPath } from "../core/config";
import { DIM, RESET } from "./format";

export function runBase(args: string[]): void {
  const subcommand = args[0];

  if (subcommand === "list") {
    const { bases } = loadConfig();

    if (Object.keys(bases).length === 0) {
      console.log('no bases configured — run "mnemo base add <name> <path>"');
      process.exit(0);
    }

    const sorted = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, path] of sorted) {
      console.log(`${name}: ${DIM}${shortenPath(path)}${RESET}`);
    }
    return;
  }

  if (subcommand === "add") {
    const name = args[1];
    const rawPath = args[2];

    if (!name || !rawPath) {
      console.error("usage: mnemo base add <name> <path>");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      console.error("base name must be lowercase letters, numbers, and hyphens");
      process.exit(1);
    }

    // expand ~ and resolve to absolute path
    const expanded = rawPath.startsWith("~")
      ? rawPath.replace("~", homedir())
      : rawPath;
    const absolutePath = resolve(expanded);

    if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
      console.error(`not a directory: ${rawPath}`);
      process.exit(1);
    }

    const { bases } = loadConfig();

    if (bases[name]) {
      console.error(`base "${name}" already exists`);
      process.exit(1);
    }

    bases[name] = absolutePath;
    saveConfig(bases);
    console.log(`added base "${name}" → ${shortenPath(absolutePath)}`);
    return;
  }

  if (subcommand === "remove") {
    const name = args[1];

    if (!name) {
      console.error("usage: mnemo base remove <name>");
      process.exit(1);
    }

    const { bases } = loadConfig();

    if (!bases[name]) {
      console.error(`unknown base: ${name}`);
      process.exit(1);
    }

    delete bases[name];
    saveConfig(bases);
    console.log(`removed base "${name}"`);
    return;
  }

  if (subcommand === "move") {
    const name = args[1];
    const rawPath = args[2];

    if (!name || !rawPath) {
      console.error("usage: mnemo base move <name> <path>");
      process.exit(1);
    }

    const { bases } = loadConfig();

    if (!bases[name]) {
      console.error(`unknown base: ${name}`);
      process.exit(1);
    }

    const expanded = rawPath.startsWith("~")
      ? rawPath.replace("~", homedir())
      : rawPath;
    const absolutePath = resolve(expanded);

    if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
      console.error(`not a directory: ${rawPath}`);
      process.exit(1);
    }

    bases[name] = absolutePath;
    saveConfig(bases);
    console.log(`moved base "${name}" → ${shortenPath(absolutePath)}`);
    return;
  }

  if (subcommand === "rename") {
    const oldName = args[1];
    const newName = args[2];

    if (!oldName || !newName) {
      console.error("usage: mnemo base rename <old-name> <new-name>");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(newName)) {
      console.error("base name must be lowercase letters, numbers, and hyphens");
      process.exit(1);
    }

    const { bases } = loadConfig();

    if (!bases[oldName]) {
      console.error(`unknown base: ${oldName}`);
      process.exit(1);
    }

    if (bases[newName]) {
      console.error(`base "${newName}" already exists`);
      process.exit(1);
    }

    bases[newName] = bases[oldName];
    delete bases[oldName];
    saveConfig(bases);
    console.log(`renamed base "${oldName}" → "${newName}"`);
    return;
  }

  console.error("usage: mnemo base <add|remove|move|rename|list>");
  process.exit(1);
}
