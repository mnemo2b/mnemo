import { existsSync, statSync } from "fs";
import { CONFIG_PATH, loadConfig } from "../core/config";
import { shortenPath } from "../core/paths";
import { isSkillInstalled, isAgentsInstalled, isHookInstalled, missingAgents, skillDir, agentsDir, settingsPath } from "./integrations";
import { readVersion } from "./package";
import { DIM, RESET, GREEN, RED } from "./format";

// -----------------------------------------------------------------------------

const OK = `${GREEN}✓${RESET}`;
const FAIL = `${RED}✗${RESET}`;

// -----------------------------------------------------------------------------

/** show install state and knowledge base wiring (exits if any check fails) */

export function runStatus(): void {
  const version = readVersion();
  const { bases, sets } = loadConfig();
  const baseEntries = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));

  const skillOk = isSkillInstalled();
  const agentsOk = isAgentsInstalled();
  const hookOk = isHookInstalled();
  const brokenBases = baseEntries.filter(([, path]) => !baseHealthy(path));

  const failed = !skillOk || !agentsOk || !hookOk || brokenBases.length > 0;

  console.log(`${DIM}cli    ${RESET} ${version}`);
  console.log(`${DIM}config ${RESET} ${shortenPath(CONFIG_PATH)}`);

  // bases
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

  // sets
  const setCount = Object.keys(sets).length;
  console.log(
    `${DIM}sets   ${RESET} ${setCount === 0 ? "none" : `${setCount} global`}`,
  );

  // install state
  const skillPath = shortenPath(skillDir());
  const agentsGlob = shortenPath(agentsDir()) + "/mnemo-*.md";
  const settingsDisplay = shortenPath(settingsPath());

  if (skillOk) {
    console.log(`${DIM}skill  ${RESET} ${skillPath} ${OK}`);
  } else {
    console.log(
      `${DIM}skill  ${RESET} ${skillPath} ${FAIL} missing — run \`mnemo install\``,
    );
  }

  if (agentsOk) {
    console.log(`${DIM}agents ${RESET} ${agentsGlob} ${OK}`);
  } else {
    const missing = missingAgents();
    const detail = missing.length > 0 ? `missing: ${missing.join(", ")}` : "missing";
    console.log(
      `${DIM}agents ${RESET} ${agentsGlob} ${FAIL} ${detail} — run \`mnemo install\``,
    );
  }

  if (hookOk) {
    console.log(`${DIM}hook   ${RESET} ${settingsDisplay} ${OK}`);
  } else {
    console.log(
      `${DIM}hook   ${RESET} ${settingsDisplay} ${FAIL} missing — run \`mnemo install\``,
    );
  }

  if (failed) process.exit(1);
}

// -----------------------------------------------------------------------------

/** check that a base's target directory exists */

function baseHealthy(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}
