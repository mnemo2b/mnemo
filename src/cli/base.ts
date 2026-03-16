import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { loadConfig, saveConfig, shortenPath } from "../core/config";
import { CLIError } from "../core/errors";
import { formatBasesHint } from "../core/base";
import { isValidName } from "../core/validate-name";
import { DIM, RESET } from "./format";

function baseList(): void {
  const { bases } = loadConfig();

  if (Object.keys(bases).length === 0) {
    console.log('no bases configured — run "mnemo base add <name> <path>"');
    return;
  }

  const sorted = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));
  for (const [name, path] of sorted) {
    console.log(`${name}: ${DIM}${shortenPath(path)}${RESET}`);
  }
}

function baseAdd(name: string | undefined, rawPath: string | undefined): void {
  if (!name || !rawPath) {
    throw new CLIError("usage: mnemo base add <name> <path>");
  }

  if (!isValidName(name)) {
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
}

function baseRemove(name: string | undefined): void {
  if (!name) {
    throw new CLIError("usage: mnemo base remove <name>");
  }

  const { bases } = loadConfig();

  if (!bases[name]) {
    throw new CLIError(`unknown base: "${name}"${formatBasesHint(bases)}`);
  }

  delete bases[name];
  saveConfig({ bases });
  console.log(`removed base "${name}"`);
}

function baseMove(name: string | undefined, rawPath: string | undefined): void {
  if (!name || !rawPath) {
    throw new CLIError("usage: mnemo base move <name> <path>");
  }

  const { bases } = loadConfig();

  if (!bases[name]) {
    throw new CLIError(`unknown base: "${name}"${formatBasesHint(bases)}`);
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
}

function baseRename(oldName: string | undefined, newName: string | undefined): void {
  if (!oldName || !newName) {
    throw new CLIError("usage: mnemo base rename <old-name> <new-name>");
  }

  if (!isValidName(newName)) {
    throw new CLIError(
      "base name must be lowercase letters, numbers, and hyphens",
    );
  }

  const { bases } = loadConfig();

  if (!bases[oldName]) {
    throw new CLIError(`unknown base: "${oldName}"${formatBasesHint(bases)}`);
  }

  if (bases[newName]) {
    throw new CLIError(`base "${newName}" already exists`);
  }

  bases[newName] = bases[oldName];
  delete bases[oldName];
  saveConfig({ bases });
  console.log(`renamed base "${oldName}" → "${newName}"`);
}

export function runBase(args: string[]): void {
  const subcommand = args[0];

  if (subcommand === "list") return baseList();
  if (subcommand === "add") return baseAdd(args[1], args[2]);
  if (subcommand === "remove") return baseRemove(args[1]);
  if (subcommand === "move") return baseMove(args[1], args[2]);
  if (subcommand === "rename") return baseRename(args[1], args[2]);

  throw new CLIError("usage: mnemo base <add|remove|move|rename|list>");
}
