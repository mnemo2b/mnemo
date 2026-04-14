import { existsSync, readFileSync, realpathSync, statSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { CONFIG_PATH, loadConfig, shortenPath } from "../core/config";
import { isSkillInstalled, isHookInstalled } from "./install";
import { DIM, RESET, GREEN, RED } from "./format";

const OK = `${GREEN}✓${RESET}`;
const FAIL = `${RED}✗${RESET}`;

/** Walk up from the CLI entry point to find package.json (for version) */
function readVersion(): string {
  let dir = dirname(realpathSync(process.argv[1]));
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate)) {
      const pkg = JSON.parse(readFileSync(candidate, "utf-8"));
      if (typeof pkg.version === "string") return pkg.version;
    }
    dir = dirname(dir);
  }
  return "unknown";
}

/** Check that a base's target directory exists and is a directory */
function baseHealthy(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Show install state and KB wiring.
 * Exit code: 0 if everything green, 1 if any check fails.
 */
export function runDoctor(): void {
  const version = readVersion();
  const { bases, sets } = loadConfig();
  const baseEntries = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));

  const skillOk = isSkillInstalled();
  const hookOk = isHookInstalled();
  const brokenBases = baseEntries.filter(([, path]) => !baseHealthy(path));

  const failed = !skillOk || !hookOk || brokenBases.length > 0;

  console.log(`${DIM}cli    ${RESET} ${version}`);
  console.log(`${DIM}config ${RESET} ${shortenPath(CONFIG_PATH)}`);

  // bases — list each with path health check, or report empty state
  if (baseEntries.length === 0) {
    console.log(
      `${DIM}bases  ${RESET} none registered — run \`mnemo base add <name> <path>\``,
    );
  } else {
    const noun = baseEntries.length === 1 ? "base" : "bases";
    console.log(`${DIM}bases  ${RESET} ${baseEntries.length} ${noun}`);
    for (const [name, path] of baseEntries) {
      const shortened = shortenPath(path);
      if (baseHealthy(path)) {
        console.log(`         ${name}  ${DIM}${shortened}${RESET} ${OK}`);
      } else {
        console.log(
          `         ${name}  ${DIM}${shortened}${RESET} ${FAIL} path does not exist`,
        );
      }
    }
  }

  // sets — count only; `mnemo set list` shows the detail view
  const setCount = Object.keys(sets).length;
  console.log(
    `${DIM}sets   ${RESET} ${setCount === 0 ? "none" : `${setCount} global`}`,
  );

  // install state — skill + hook wiring into ~/.claude
  const skillPath = shortenPath(join(homedir(), ".claude", "skills", "mnemo"));
  const settingsPath = shortenPath(join(homedir(), ".claude", "settings.json"));

  if (skillOk) {
    console.log(`${DIM}skill  ${RESET} ${skillPath} ${OK}`);
  } else {
    console.log(
      `${DIM}skill  ${RESET} ${skillPath} ${FAIL} missing — run \`mnemo setup\``,
    );
  }

  if (hookOk) {
    console.log(`${DIM}hook   ${RESET} ${settingsPath} ${OK}`);
  } else {
    console.log(
      `${DIM}hook   ${RESET} ${settingsPath} ${FAIL} missing — run \`mnemo setup\``,
    );
  }

  if (failed) process.exit(1);
}
