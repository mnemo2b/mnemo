import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { loadConfig, saveConfig, shortenPath } from "../core/config";
import { CLIError } from "../core/errors";
import { formatBasesHint } from "../core/base";
import { isValidName } from "../core/validate-name";
import { DIM, RESET } from "./format";
import { installIntegrations } from "./integrations";

// -----------------------------------------------------------------------------

/** dispatch base subcommands to handlers */

export function runBase(args: string[]): void {
  switch (args[0]) {
    case "list": return baseList();
    case "add": return baseAdd(args[1], args[2]);
    case "remove": return baseRemove(args[1]);
    case "move": return baseMove(args[1], args[2]);
    case "rename": return baseRename(args[1], args[2]);
    default: throw new CLIError("usage: mnemo base <add|remove|move|rename|list>");
  }
}

// -----------------------------------------------------------------------------

/** register a new base directory */

function baseAdd(name: string | undefined, rawPath: string | undefined): void {
  if (!name || !rawPath) {
    throw new CLIError("usage: mnemo base add <name> <path>");
  }

  if (!isValidName(name)) {
    throw new CLIError(
      "failed: base name must be:\n  - lowercase letters\n  - numbers\n  - hyphens\n  - underscores",
    );
  }

  const absolutePath = resolveUserPath(rawPath);

  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    throw new CLIError(`failed: not a directory: ${rawPath}`);
  }

  const { bases } = loadConfig();

  if (bases[name]) {
    throw new CLIError(`failed: base "${name}" already exists`);
  }

  bases[name] = absolutePath;
  saveConfig({ bases });
  console.log(`added base "${name}" → ${shortenPath(absolutePath)}`);

  // registering a base is the strongest signal that the user intends to use
  // mnemo, so it's the right moment to put the skill and hook in place.
  const installed = installIntegrations();

  if (installed.skill || installed.agents || installed.hook) {
    console.log("");
    console.log("installed:");
    if (installed.skill)  console.log(`  skill    ${DIM}~/.claude/skills/mnemo/${RESET}`);
    if (installed.agents) console.log(`  agents   ${DIM}~/.claude/agents/mnemo-*.md${RESET}`);
    if (installed.hook)   console.log(`  hook     ${DIM}~/.claude/settings.json${RESET}`);
    console.log("");
    console.log("your knowledge base will be available in your next Claude Code session.");
  }
}

/** list all registered bases */

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

/** update a base's path */

function baseMove(name: string | undefined, rawPath: string | undefined): void {
  if (!name || !rawPath) {
    throw new CLIError("usage: mnemo base move <name> <path>");
  }

  const { bases } = loadConfig();

  if (!bases[name]) {
    throw new CLIError(`unknown base: "${name}"${formatBasesHint(bases)}`);
  }

  const absolutePath = resolveUserPath(rawPath);

  if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
    throw new CLIError(`failed: not a directory: ${rawPath}`);
  }

  bases[name] = absolutePath;
  saveConfig({ bases });
  console.log(`moved base "${name}" → ${shortenPath(absolutePath)}`);
}

/** unregister a base */

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

/** rename a base and update any set paths that reference it */

function baseRename(oldName: string | undefined, newName: string | undefined): void {
  if (!oldName || !newName) {
    throw new CLIError("usage: mnemo base rename <old-name> <new-name>");
  }

  if (!isValidName(newName)) {
    throw new CLIError(
      "failed: base name must be:\n  - lowercase letters\n  - numbers\n  - hyphens\n  - underscores",
    );
  }

  const { bases, sets } = loadConfig();

  if (!bases[oldName]) {
    throw new CLIError(`unknown base: "${oldName}"${formatBasesHint(bases)}`);
  }

  if (bases[newName]) {
    throw new CLIError(`failed: base "${newName}" already exists`);
  }

  bases[newName] = bases[oldName];
  delete bases[oldName];

  // cascade the rename into set entries that reference the old base name
  const prefix = oldName + "/";
  let updatedPaths = 0;

  for (const entries of Object.values(sets)) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i]!.startsWith(prefix)) {
        entries[i] = newName + "/" + entries[i]!.slice(prefix.length);
        updatedPaths++;
      }
    }
  }

  saveConfig({ bases, sets });

  const hint = updatedPaths > 0
    ? ` (updated ${updatedPaths} set path${updatedPaths !== 1 ? "s" : ""})`
    : "";

  console.log(`renamed base "${oldName}" → "${newName}"${hint}`);
}

// -----------------------------------------------------------------------------

/** expand ~ and resolve to absolute path */

function resolveUserPath(rawPath: string): string {
  const expanded = rawPath.startsWith("~")
    ? rawPath.replace("~", homedir())
    : rawPath;

  return resolve(expanded);
}
