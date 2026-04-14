import { installSkill, installHook } from "./install";

/** Install skill files and session hook */
export function runSetup(): void {
  installSkill();
  const hookExisted = installHook();

  const hookNote = hookExisted ? " (already configured)" : "";

  console.log("mnemo is ready.");
  console.log("");
  console.log("  skill    ~/.claude/skills/mnemo/");
  console.log(`  hook     ~/.claude/settings.json${hookNote}`);
  console.log("");
  console.log("next, add a knowledge base:");
  console.log("");
  console.log("  mnemo base add <name> <path>");
  console.log("");
  console.log("when you start a Claude Code session, send any message");
  console.log("and Claude will present your sets automatically.");
  console.log("");
  console.log("to create sets, run:");
  console.log("");
  console.log("  mnemo set add <name> <paths...>");
}
