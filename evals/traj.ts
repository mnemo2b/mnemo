// renders a trajectory .jsonl file as a readable timeline.
// usage: bun evals/traj.ts <file.jsonl>
//        bun evals/traj.ts --latest

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const RUNS_DIR = join(import.meta.dirname!, "runs");
const DIVIDER = "─".repeat(50);

// ------------------------------------------------------------------

function resolve(): string {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: bun evals/traj.ts <file.jsonl | --latest>");
    process.exit(1);
  }

  if (arg === "--latest") {
    const runs = readdirSync(RUNS_DIR)
      .filter((d) => statSync(join(RUNS_DIR, d)).isDirectory())
      .sort()
      .reverse();

    if (runs.length === 0) {
      console.error("no runs found in evals/runs/");
      process.exit(1);
    }

    // find the most recent .jsonl across all run dirs
    const latestRun = join(RUNS_DIR, runs[0]);
    const files = readdirSync(latestRun)
      .filter((f) => f.endsWith(".jsonl"))
      .sort();

    if (files.length === 0) {
      console.error(`no trajectory files in ${latestRun}`);
      process.exit(1);
    }

    // show all files from the latest run
    console.log(`\nrun: ${runs[0]} (${files.length} trajectories)\n`);
    const bar = "━".repeat(60);
    for (let i = 0; i < files.length; i++) {
      const label = files[i].replace(/\.jsonl$/, "");
      console.log(bar);
      console.log(`  [${i + 1}/${files.length}] ${label}`);
      console.log(bar);
      console.log();
      renderFile(join(latestRun, files[i]));
      console.log();
      console.log();
      console.log();
    }
    return "";
  }

  return arg;
}

// ------------------------------------------------------------------

function renderFile(path: string) {
  const lines = readFileSync(path, "utf-8").trim().split("\n");
  const events = lines.map((l) => {
    try { return JSON.parse(l); }
    catch { return null; }
  }).filter(Boolean);

  for (const event of events) {
    renderEvent(event);
  }
}

function renderEvent(event: Record<string, unknown>) {
  const type = event.type as string;

  if (type === "meta") {
    console.log(`── request ${DIVIDER}`);
    console.log(event.prompt as string);
    console.log();

    const description = event.description as string | undefined;
    const assertions = event.assertions as Array<Record<string, unknown>> | undefined;

    if (description || (assertions && assertions.length > 0)) {
      console.log(`── test${description ? `: ${description}` : ""} ${DIVIDER}`);
      if (assertions && assertions.length > 0) {
        for (const a of assertions) {
          const metric = (a.metric as string) ?? "(unnamed)";
          const weight = a.weight as number | undefined;
          const value = a.value as string | undefined;
          const weightStr = weight !== undefined ? ` (w=${weight})` : "";
          console.log(`  • ${metric}${weightStr}`);
          if (value) console.log(`    ${value}`);
        }
      }
      console.log();
    }
    return;
  }

  if (type === "system" && event.subtype === "hook_response") {
    const name = (event.hook_name as string) ?? "hook";
    const exit = event.exit_code as number;
    const label = exit === 0 ? "ok" : `exit ${exit}`;
    console.log(`── hook: ${name} (${label}) ${DIVIDER}`);

    // show a brief excerpt of the output, not the full tree
    const output = (event.output as string) ?? "";
    const firstLines = output.split("\n").slice(0, 3).join("\n");
    console.log(firstLines);
    if (output.split("\n").length > 3) {
      console.log(`  ... (${output.split("\n").length} lines)`);
    }
    console.log();
    return;
  }

  if (type === "assistant") {
    const msg = event.message as Record<string, unknown>;
    const content = (msg?.content as Array<Record<string, unknown>>) ?? [];

    for (const block of content) {
      if (block.type === "thinking") {
        console.log(`── thinking ${DIVIDER}`);
        console.log(block.thinking as string);
        console.log();
      }

      if (block.type === "tool_use") {
        console.log(`── tool: ${block.name} ${DIVIDER}`);
        const input = block.input as Record<string, unknown>;
        // show compact input
        for (const [key, val] of Object.entries(input)) {
          const valStr = typeof val === "string" ? val : JSON.stringify(val);
          console.log(`  ${key}: ${valStr}`);
        }
        console.log();
      }

      if (block.type === "text") {
        console.log(`── response ${DIVIDER}`);
        console.log(block.text as string);
        console.log();
      }
    }
    return;
  }

  if (type === "user") {
    const msg = event.message as Record<string, unknown>;
    const content = (msg?.content as Array<Record<string, unknown>>) ?? [];

    for (const block of content) {
      if (block.type === "tool_result") {
        const output = block.content as string ?? "";
        const isError = block.is_error as boolean;
        const prefix = isError ? "✗" : "→";

        console.log(`  ${prefix} result:`);
        const lines = output.split("\n");
        if (lines.length <= 15) {
          console.log(output);
        } else {
          console.log(lines.slice(0, 10).join("\n"));
          console.log(`  ... (${lines.length} lines)`);
        }
        console.log();
      }
    }
    return;
  }

  if (type === "result") {
    const turns = event.num_turns as number ?? 0;
    const duration = event.duration_ms as number ?? 0;
    const cost = event.total_cost_usd as number ?? 0;
    const stop = event.stop_reason as string ?? "";

    console.log(`── summary ${DIVIDER}`);
    console.log(`${turns} turns · ${(duration / 1000).toFixed(1)}s · $${cost.toFixed(4)} · ${stop}`);
    return;
  }
}

// ------------------------------------------------------------------

const file = resolve();
if (file) renderFile(file);
