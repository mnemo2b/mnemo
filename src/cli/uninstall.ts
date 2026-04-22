import { existsSync, readFileSync, readdirSync, writeFileSync, rmSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { CONFIG_PATH } from "../core/config";
import { skillDir, agentsDir, settingsPath } from "./integrations";
import type { SessionStartEntry } from "../types/hooks";

// -----------------------------------------------------------------------------

/** remove skill, agents, session hook, and config */

export function runUninstall(): void {
  const skillRemoved = removeSkill();
  const agentsRemoved = removeAgents();
  const hookRemoved = removeHook();
  const configRemoved = removeConfig();

  const status = (removed: boolean) => (removed ? "(removed)" : "(not found)");

  console.log("mnemo uninstalled.");
  console.log("");
  console.log(`  skill    ~/.claude/skills/mnemo/ ${status(skillRemoved)}`);
  console.log(`  agents   ~/.claude/agents/mnemo-*.md ${status(agentsRemoved)}`);
  console.log(`  hook     ~/.claude/settings.json ${status(hookRemoved)}`);
  console.log(`  config   ~/.config/mnemo/ ${status(configRemoved)}`);
  console.log("");
  console.log("to reinstall, run: mnemo install");
}

// -----------------------------------------------------------------------------

/** remove mnemo-*.md agents from ~/.claude/agents/ */

function removeAgents(): boolean {
  const target = agentsDir();
  if (!existsSync(target)) return false;

  const mnemoFiles = readdirSync(target).filter(
    (file) => file.startsWith("mnemo-") && file.endsWith(".md"),
  );
  if (mnemoFiles.length === 0) return false;

  for (const file of mnemoFiles) unlinkSync(join(target, file));
  return true;
}

/** delete ~/.config/mnemo/ */

function removeConfig(): boolean {
  const configDir = dirname(CONFIG_PATH);
  if (!existsSync(configDir)) return false;

  rmSync(configDir, { recursive: true, force: true });
  return true;
}

/** remove the mnemo prime hook from ~/.claude/settings.json */

function removeHook(): boolean {
  const path = settingsPath();
  if (!existsSync(path)) return false;

  const settings = JSON.parse(readFileSync(path, "utf-8"));

  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as SessionStartEntry[];

  const filtered = sessionStart.filter(
    (entry) => !entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );

  if (filtered.length === sessionStart.length) return false;

  hooks.SessionStart = filtered;
  settings.hooks = hooks;
  writeFileSync(path, JSON.stringify(settings, null, 2), "utf-8");
  return true;
}

/** delete ~/.claude/skills/mnemo/ */

function removeSkill(): boolean {
  const target = skillDir();
  if (!existsSync(target)) return false;

  rmSync(target, { recursive: true, force: true });
  return true;
}
