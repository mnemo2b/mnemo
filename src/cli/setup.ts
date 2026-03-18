import {
  cpSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  realpathSync,
} from "fs";
import { join, dirname } from "path";
import { homedir } from "os";

/** Walk up from the CLI entry point to find the package root containing skill/ */
function findSkillSource(): string {
  // resolve symlinks so global installs (npm install -g) start from the
  // real file location, not the symlink in /usr/local/bin
  let dir = dirname(realpathSync(process.argv[1]));
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "skill", "SKILL.md");
    if (existsSync(candidate)) return join(dir, "skill");
    dir = dirname(dir);
  }
  throw new Error("could not find skill/ directory — is mnemo installed correctly?");
}

function installSkill(): void {
  const source = findSkillSource();
  const target = join(homedir(), ".claude", "skills", "mnemo");
  // clean install — remove stale files before copying
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

/** Returns true if the hook was already configured */
function installHook(): boolean {
  const settingsPath = join(homedir(), ".claude", "settings.json");

  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  }

  // ensure hooks.SessionStart exists as an array
  const hooks = (settings.hooks ?? {}) as Record<string, unknown>;
  const sessionStart = (hooks.SessionStart ?? []) as Array<{
    matcher?: string;
    hooks?: Array<{ type: string; command: string }>;
  }>;

  // check if a mnemo prime hook already exists
  const alreadyInstalled = sessionStart.some((entry) =>
    entry.hooks?.some((h) => h.command.includes("mnemo prime")),
  );

  if (alreadyInstalled) return true;

  // add the hook entry
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

/** Install skill files and session hook */
export function runSetup(): void {
  installSkill();
  const hookExisted = installHook();

  const hookNote = hookExisted ? " (already configured)" : "";

  console.log("mnemo is ready.");
  console.log("");
  console.log("  skill   ~/.claude/skills/mnemo/");
  console.log(`  hook    ~/.claude/settings.json${hookNote}`);
  console.log("");
  console.log("get started by adding a knowledge base:");
  console.log("");
  console.log("  mnemo base add <name> <path>");
  console.log("");
  console.log("then bundle paths into sets with:");
  console.log("");
  console.log("  mnemo set add <name> <paths...>");
}
