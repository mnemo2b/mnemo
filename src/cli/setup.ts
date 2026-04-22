import { installSkill, installAgents, installHook } from "./install";

// -----------------------------------------------------------------------------

/** installs skill, agents, and session hook */

export function runSetup(): void {
  installSkill();
  installAgents();
  const hookExisted = installHook();
  const hookNote = hookExisted ? " (already configured)" : "";

  console.log("mnemo is ready.");
  console.log("");
  console.log("  skill    ~/.claude/skills/mnemo/");
  console.log("  agents   ~/.claude/agents/mnemo-*.md");
  console.log(`  hook     ~/.claude/settings.json${hookNote}`);
  console.log("");
  console.log("get started:");
  console.log("");
  console.log("  mnemo base add <name> <path>       register a knowledge base");
  console.log("  mnemo set add <name> <paths...>    collect files into reusable sets");
  console.log("");
  console.log("your sets and knowledge bases will be available in Claude Code.");
}
