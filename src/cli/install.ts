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

/**
 * Walk up from the CLI entry point (dist) to find the skill directory
 */
function findSkillSource(): string {
  // resolve symlinks to start from the real file location
  let dir = dirname(realpathSync(process.argv[1]!));
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "skill", "SKILL.md");
    if (existsSync(candidate)) return join(dir, "skill");
    dir = dirname(dir);
  }
	const message = "couldn't find skill/ - try reinstalling with npm install -g @mnemo2b/mnemo"
  throw new Error(message);
}

/**
 * Checks if the skill exists in the users claude skills directory
 */
export function isSkillInstalled(): boolean {
  return existsSync(join(SKILL_TARGET(), "SKILL.md"));
}

/**
 * Transform a skill/agents/ source filename to its staged ~/.claude/agents/ name
 */
function stagedAgentName(sourceFile: string): string {
  return `mnemo-${sourceFile.replace(/\.md$/, "")}.md`;
}

/**
 * Expected agents, derived from skill/agents/ in the package
 */
function expectedAgentFilenames(): string[] {
  const source = join(findSkillSource(), "agents");
  if (!existsSync(source)) return [];
  return readdirSync(source)
    .filter((f) => f.endsWith(".md"))
    .map(stagedAgentName);
}

/**
 * True if every expected mnemo-*.md agent is staged under ~/.claude/agents/
 */
export function isAgentsInstalled(): boolean {
  return missingAgents().length === 0;
}

/**
 * List of expected agent filenames that are missing from ~/.claude/agents/
 */
export function missingAgents(): string[] {
  const target = AGENTS_TARGET();
  const expected = expectedAgentFilenames();
  if (expected.length === 0) return [];
  if (!existsSync(target)) return expected;
  return expected.filter((name) => !existsSync(join(target, name)));
}

/**
 * True if a SessionStart hook running `mnemo prime` is configured
 */
export function isHookInstalled(): boolean {
  const settingsPath = SETTINGS_PATH();
  if (!existsSync(settingsPath)) return false;

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    // malformed settings file — treat as not installed so setup can fix it
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

/**
 * Copy skill files to ~/.claude/skills/mnemo/ (clean install)
 */
export function installSkill(): void {
  const source = findSkillSource();
  const target = SKILL_TARGET();
  // clean install — remove stale files before copying
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

/**
 * Stage agents from skill/agents/ to ~/.claude/agents/ for named discovery
 */
export function installAgents(): void {
  const source = join(findSkillSource(), "agents");
  if (!existsSync(source)) return;

  const target = AGENTS_TARGET();
  mkdirSync(target, { recursive: true });

  for (const file of readdirSync(source)) {
    if (!file.endsWith(".md")) continue;
    cpSync(join(source, file), join(target, stagedAgentName(file)));
  }
}

/**
 * Add SessionStart hook to ~/.claude/settings.json.
 * Returns true if the hook was already present (no write performed).
 */
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
