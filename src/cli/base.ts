import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { loadConfig, saveConfig, shortenPath } from "../core/config";
import { CLIError } from "../core/errors";
import { DIM, RESET } from "./format";

export function runBase(args: string[]): void {
  const subcommand = args[0];

  // ---------------------------------------------------------------------------

  if (subcommand === "list") {
    const { bases } = loadConfig();

    if (Object.keys(bases).length === 0) {
      console.log('no bases configured — run "mnemo base add <name> <path>"');
      return;
    }

    const sorted = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, path] of sorted) {
      console.log(`${name}: ${DIM}${shortenPath(path)}${RESET}`);
    }
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "add") {
    const name = args[1];
    const rawPath = args[2];

    if (!name || !rawPath) {
      throw new CLIError("usage: mnemo base add <name> <path>");
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new CLIError(
        "base name must be lowercase letters, numbers, and hyphens",
      );
    }

    // expand ~ and resolve to absolute path
    const expanded = rawPath.startsWith("~")
      ? rawPath.replace("~", homedir())
      : rawPath;
    const absolutePath = resolve(expanded);

    if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
      throw new CLIError(`not a directory: ${rawPath}`);
    }

    const { bases } = loadConfig();

    if (bases[name]) {
      throw new CLIError(`base "${name}" already exists`);
    }

    bases[name] = absolutePath;
    saveConfig({ bases });
    console.log(`added base "${name}" → ${shortenPath(absolutePath)}`);
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "remove") {
    const name = args[1];

    if (!name) {
      throw new CLIError("usage: mnemo base remove <name>");
    }

    const { bases } = loadConfig();

    if (!bases[name]) {
      throw new CLIError(`unknown base: ${name}`);
    }

    delete bases[name];
    saveConfig({ bases });
    console.log(`removed base "${name}"`);
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "move") {
    const name = args[1];
    const rawPath = args[2];

    if (!name || !rawPath) {
      throw new CLIError("usage: mnemo base move <name> <path>");
    }

    const { bases } = loadConfig();

    if (!bases[name]) {
      throw new CLIError(`unknown base: ${name}`);
    }

    const expanded = rawPath.startsWith("~")
      ? rawPath.replace("~", homedir())
      : rawPath;
    const absolutePath = resolve(expanded);

    if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
      throw new CLIError(`not a directory: ${rawPath}`);
    }

    bases[name] = absolutePath;
    saveConfig({ bases });
    console.log(`moved base "${name}" → ${shortenPath(absolutePath)}`);
    return;
  }

  // ---------------------------------------------------------------------------

  if (subcommand === "rename") {
    const oldName = args[1];
    const newName = args[2];

    if (!oldName || !newName) {
      throw new CLIError("usage: mnemo base rename <old-name> <new-name>");
    }

    if (!/^[a-z0-9-]+$/.test(newName)) {
      throw new CLIError(
        "base name must be lowercase letters, numbers, and hyphens",
      );
    }

    const { bases } = loadConfig();

    if (!bases[oldName]) {
      throw new CLIError(`unknown base: ${oldName}`);
    }

    if (bases[newName]) {
      throw new CLIError(`base "${newName}" already exists`);
    }

    bases[newName] = bases[oldName];
    delete bases[oldName];
    saveConfig({ bases });
    console.log(`renamed base "${oldName}" → "${newName}"`);
    return;
  }

  // ---------------------------------------------------------------------------

  throw new CLIError("usage: mnemo base <add|remove|move|rename|list>");
}
