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
import { findPackageRoot } from "./package";

// -----------------------------------------------------------------------------

// paths where the skill, agents, and hooks live (used by integrations, status)

const SKILL_TARGET = () => join(homedir(), ".claude", "skills", "mnemo");
const AGENTS_TARGET = () => join(homedir(), ".claude", "agents");
const SETTINGS_PATH = () => join(homedir(), ".claude", "settings.json");

// -----------------------------------------------------------------------------

export interface InstallResult {
  skill: boolean;
  agents: boolean;
  hook: boolean;
}

/** install skill, agents, and hook — skips what's already in place */

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

export function installSkill(): void {
  const source = join(findPackageRoot(), "skill");
  const target = SKILL_TARGET();
  // clean install — remove stale files before copying
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

/** checks if the skill exists in the users claude skills directory */

export function isSkillInstalled(): boolean {
  return existsSync(join(SKILL_TARGET(), "SKILL.md"));
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

export function installAgents(): void {
  const source = join(findPackageRoot(), "agents");
  if (!existsSync(source)) return;

  const target = AGENTS_TARGET();
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
  const target = AGENTS_TARGET();
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

export function installHook(): boolean {
  const settingsPath = SETTINGS_PATH();

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  }

  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as Array<{
    matcher?: string;
    hooks?: Array<{ type: string; command: string }>;
  }>;

  const alreadyInstalled = sessionStart.some((entry) =>
    entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );

  if (alreadyInstalled) return true;

  sessionStart.push({
    matcher: "",
    hooks: [{ type: "command", command: "mnemo prime" }],
  });

  hooks.SessionStart = sessionStart;
  settings.hooks = hooks;

  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  return false;
}

/** checks if `mnemo prime` is configured */

export function isHookInstalled(): boolean {
  const settingsPath = SETTINGS_PATH();
  if (!existsSync(settingsPath)) return false;

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    // malformed settings file
    return false;
  }

  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as Array<{
    hooks?: Array<{ command: string }>;
  }>;

  return sessionStart.some((entry) =>
    entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );
}


