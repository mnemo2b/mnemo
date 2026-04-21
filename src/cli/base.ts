import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { loadConfig, saveConfig, shortenPath } from "../core/config";
import { CLIError } from "../core/errors";
import { formatBasesHint } from "../core/base";
import { isValidName } from "../core/validate-name";
import { DIM, RESET } from "./format";
import {
  isSkillInstalled,
  isAgentsInstalled,
  isHookInstalled,
  installSkill,
  installAgents,
  installHook,
} from "./install";

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
      "failed: base name must be lowercase letters, numbers, hyphens, and underscores",
    );
  }

  // expand ~ and resolve to absolute path
  const expanded = rawPath.startsWith("~")
    ? rawPath.replace("~", homedir())
    : rawPath;
  const absolutePath = resolve(expanded);

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

  // auto-wire claude code if setup hasn't run yet. registering a base is
  // the strongest signal that the user intends to use mnemo, so it's the
  // right moment to put the skill and hook in place.
  maybeWireClaudeCode();
}

/**
 * If the skill or hook is missing, install both and tell the user what
 * happened. No-op when everything is already wired.
 */
function maybeWireClaudeCode(): void {
  if (isSkillInstalled() && isAgentsInstalled() && isHookInstalled()) return;

  installSkill();
  installAgents();
  installHook();

  console.log("");
  console.log("wiring up Claude Code:");
  console.log("  skill    ~/.claude/skills/mnemo/");
  console.log("  agents   ~/.claude/agents/mnemo-*.md");
  console.log("  hook     ~/.claude/settings.json");
  console.log("");
  console.log("your next Claude Code session will start with your knowledge");
  console.log("base in context. run `mnemo setup` again if these get removed.");
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
    throw new CLIError(`failed: not a directory: ${rawPath}`);
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
      "failed: base name must be lowercase letters, numbers, hyphens, and underscores",
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

  // update set entries that reference the old base name
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
  const hint = updatedPaths > 0 ? ` (updated ${updatedPaths} set path${updatedPaths !== 1 ? "s" : ""})` : "";
  console.log(`renamed base "${oldName}" → "${newName}"${hint}`);
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
