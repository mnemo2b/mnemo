import { createInterface } from "readline";
import { installIntegrations } from "./integrations";
import { DIM, RESET } from "./format";

// -----------------------------------------------------------------------------

/** install skill, agents, and session hook */

export async function runInstall(args: string[] = []): Promise<void> {
  const force = args.includes("--force");

  if (force) {
    const message = [
      "this will overwrite:",
      `  - skill    ${DIM}~/.claude/skills/mnemo/${RESET}`,
      `  - agents   ${DIM}~/.claude/agents/mnemo-*.md${RESET}`,
      `  - hook     ${DIM}~/.claude/settings.json${RESET}`,
      "",
      "continue? (y/n)",
    ].join("\n");

    if (!await confirm(message)) {
      console.log("cancelled.");
      return;
    }
  }

  const result = installIntegrations({ force });
  const installed = result.skill || result.agents || result.hook;

  if (!installed) {
    console.log("already installed — nothing to do.");
    return;
  }

  console.log("installed:");
  if (result.skill)  console.log(`  skill    ${DIM}~/.claude/skills/mnemo/${RESET}`);
  if (result.agents) console.log(`  agents   ${DIM}~/.claude/agents/mnemo-*.md${RESET}`);
  if (result.hook)   console.log(`  hook     ${DIM}~/.claude/settings.json${RESET}`);
  console.log("");
  console.log("get started:");
  console.log("");
  console.log("  mnemo base add <name> <path>       register a knowledge base");
  console.log("  mnemo set add <name> <paths...>    collect files into reusable sets");
  console.log("");
  console.log("your knowledge base will be available in your next Claude Code session.");
}

// -----------------------------------------------------------------------------

/** simple y/n confirmation */

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
