import { existsSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { CONFIG_PATH } from "../core/config";

function removeSkill(): boolean {
  const target = join(homedir(), ".claude", "skills", "mnemo");
  if (!existsSync(target)) return false;

  rmSync(target, { recursive: true, force: true });
  return true;
}

function removeHook(): boolean {
  const settingsPath = join(homedir(), ".claude", "settings.json");
  if (!existsSync(settingsPath)) return false;

  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));

  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as Array<{
    matcher?: string;
    hooks?: Array<{ type: string; command: string }>;
  }>;

  const filtered = sessionStart.filter(
    (entry) => !entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );

  // nothing was removed
  if (filtered.length === sessionStart.length) return false;

  hooks.SessionStart = filtered;
  settings.hooks = hooks;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  return true;
}

function removeConfig(): boolean {
  const configDir = dirname(CONFIG_PATH);
  if (!existsSync(configDir)) return false;

  rmSync(configDir, { recursive: true, force: true });
  return true;
}

/** Remove skill files, session hook, and config */
export function runTeardown(): void {
  const skillRemoved = removeSkill();
  const hookRemoved = removeHook();
  const configRemoved = removeConfig();

  const status = (removed: boolean) => (removed ? "(removed)" : "(not found)");

  console.log("mnemo removed.");
  console.log("");
  console.log(`  skill    ~/.claude/skills/mnemo/ ${status(skillRemoved)}`);
  console.log(`  hook     ~/.claude/settings.json ${status(hookRemoved)}`);
  console.log(`  config   ~/.config/mnemo/ ${status(configRemoved)}`);
  console.log("");
  console.log("to reinstall, run: mnemo setup");
}
