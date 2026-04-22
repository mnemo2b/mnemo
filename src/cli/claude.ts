import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { findPackageRoot } from "@/cli/package";
import type { SessionStartEntry } from "@/types/hooks";

// -----------------------------------------------------------------------------

export interface InstallResult {
  skill: boolean;
  agents: boolean;
  hook: boolean;
}

// -----------------------------------------------------------------------------

/** path to the installed skill directory */

export function skillDir(): string {
  return join(homedir(), ".claude", "skills", "mnemo");
}

/** path to the claude agents directory */

export function agentsDir(): string {
  return join(homedir(), ".claude", "agents");
}

/** path to the claude settings file */

export function settingsPath(): string {
  return join(homedir(), ".claude", "settings.json");
}

// -----------------------------------------------------------------------------

/** install skill, agents, and hook (if necessary) */

export function installIntegrations(options: { force?: boolean } = {}): InstallResult {
  const { force = false } = options;
  const result: InstallResult = { skill: false, agents: false, hook: false };

  if (force || !isSkillInstalled()) {
    installSkill();
    result.skill = true;
  }

  if (force || !isAgentsInstalled()) {
    installAgents();
    result.agents = true;
  }

  if (force || !isHookInstalled()) {
    installHook();
    result.hook = true;
  }

  return result;
}

// -----------------------------------------------------------------------------

/** copy skill files to ~/.claude/skills/mnemo/ (clean install) */

function installSkill(): void {
  const source = join(findPackageRoot(), "skill");
  const target = skillDir();
  // clean install — remove stale files before copying
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

/** checks if the skill exists in the users claude skills directory */

export function isSkillInstalled(): boolean {
  return existsSync(join(skillDir(), "SKILL.md"));
}

// -----------------------------------------------------------------------------

/** a list of mnemo agents that should be in ~/.claude/agents  */

function expectedAgentFilenames(): string[] {
  const source = join(findPackageRoot(), "agents");
  if (!existsSync(source)) return [];
  return readdirSync(source)
    .filter((f) => f.endsWith(".md"))
    .map(stagedAgentName);
}

/** stage agents from agents/ to ~/.claude/agents/ for named discovery */

function installAgents(): void {
  const source = join(findPackageRoot(), "agents");
  if (!existsSync(source)) return;

  const target = agentsDir();
  mkdirSync(target, { recursive: true });

  for (const file of readdirSync(source)) {
    if (!file.endsWith(".md")) continue;
    cpSync(join(source, file), join(target, stagedAgentName(file)));
  }
}

/** checks ~/.claude/agents for mnemo agents */

export function isAgentsInstalled(): boolean {
  return missingAgents().length === 0;
}

/** list of mnemo agents missing from ~/.claude/agents */

export function missingAgents(): string[] {
  const target = agentsDir();
  const expected = expectedAgentFilenames();
  if (expected.length === 0) return [];
  if (!existsSync(target)) return expected;
  return expected.filter((name) => !existsSync(join(target, name)));
}

/** transforms an agents filename (save) to a staged name (mnemo-save) */

function stagedAgentName(sourceFile: string): string {
  return `mnemo-${sourceFile.replace(/\.md$/, "")}.md`;
}

// -----------------------------------------------------------------------------

/** add SessionStart hook to ~/.claude/settings.json */

function installHook(): void {
  const path = settingsPath();

  let settings: Record<string, unknown> = {};
  if (existsSync(path)) {
    settings = JSON.parse(readFileSync(path, "utf-8"));
  }

  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as SessionStartEntry[];

  // prevent duplicate entries on force reinstall
  const alreadyInstalled = sessionStart.some((entry) =>
    entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );

  if (alreadyInstalled) return;

  sessionStart.push({
    matcher: "",
    hooks: [{ type: "command", command: "mnemo prime" }],
  });

  hooks.SessionStart = sessionStart;
  settings.hooks = hooks;

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(settings, null, 2), "utf-8");
}

/** checks if `mnemo prime` is configured */

export function isHookInstalled(): boolean {
  const path = settingsPath();
  if (!existsSync(path)) return false;

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    // malformed settings file
    return false;
  }

  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as SessionStartEntry[];

  return sessionStart.some((entry) =>
    entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );
}
