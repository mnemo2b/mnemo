import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  realpathSync,
} from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

// -----------------------------------------------------------------------------

// paths where the skill, agents, and hooks live (used by install, doctor)

const SKILL_TARGET = () => join(homedir(), ".claude", "skills", "mnemo");
const AGENTS_TARGET = () => join(homedir(), ".claude", "agents");
const SETTINGS_PATH = () => join(homedir(), ".claude", "settings.json");


// -----------------------------------------------------------------------------

/** walk up from the CLI entry point (dist) to find the package root */

function findPackageRoot(): string {
  // resolve symlinks and start from the real location
  let dir = dirname(realpathSync(process.argv[1]!));
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  const message = "couldn't find package root — try reinstalling with npm install -g @mnemo2b/mnemo";
  throw new Error(message);
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


