// renders a trajectory .jsonl file as a readable timeline.
// usage: bun evals/traj.ts <file.jsonl>
//        bun evals/traj.ts --latest

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const RUNS_DIR = join(import.meta.dirname!, "runs");
const RULE = "─".repeat(72);

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
  console.log();
  const lines = readFileSync(path, "utf-8").trim().split("\n");
  const events = lines.map((l) => {
    try { return JSON.parse(l); }
    catch { return null; }
  }).filter(Boolean);

  // separate meta (our test metadata) from stream events so hooks
  // render first — matching the real session order
  const meta = events.find((e) => e.type === "meta");
  const hooks: typeof events = [];
  const rest: typeof events = [];
  for (const e of events) {
    if (e.type === "meta") continue;
    if (e.type === "system" && String(e.subtype ?? "").startsWith("hook")) {
      hooks.push(e);
    } else {
      rest.push(e);
    }
  }

  let t0: number | null = null;
  let lastT: number | null = null;

  const advance = (event: Record<string, unknown>) => {
    const t = event.__t as number | undefined;
    if (t && t0 === null) t0 = t;
    renderEvent(event, t0, lastT);
    if (t) lastT = t;
  };

  // realistic order: hooks → request/test → assistant responses
  for (const h of hooks) advance(h);
  if (meta) renderEvent(meta, t0, lastT);
  for (const e of rest) advance(e);
}

// formats elapsed + delta for display on event lines
function timing(t: number | undefined, t0: number | null, lastT: number | null): string {
  if (!t || !t0) return "";
  const elapsed = ((t - t0) / 1000).toFixed(1);
  const delta = lastT ? `+${((t - lastT) / 1000).toFixed(1)}s` : "start";
  return ` [${delta}, ${elapsed}s]`;
}

function renderEvent(event: Record<string, unknown>, t0: number | null, lastT: number | null) {
  const type = event.type as string;

  switch (type) {
    case "meta": return renderMeta(event);
    case "system": if (event.subtype === "hook_response") return renderHook(event, t0, lastT); break;
    case "assistant": return renderAssistant(event, t0, lastT);
    case "user": return renderUser(event, t0, lastT);
    case "result": return renderResult(event);
  }
}

function renderMeta(event: Record<string, unknown>) {
  console.log(RULE);
  console.log("request\n");
  console.log(event.prompt as string);
  console.log("\n");

  const description = event.description as string | undefined;
  const assertions = event.assertions as Array<Record<string, unknown>> | undefined;

  if (!description && (!assertions || assertions.length === 0)) return;

  console.log(RULE);
  console.log(`test${description ? `: ${description}` : ""}\n`);
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
  console.log("\n");
}

function renderHook(event: Record<string, unknown>, t0: number | null, lastT: number | null) {
  const t = event.__t as number | undefined;
  const name = (event.hook_name as string) ?? "hook";
  const exit = event.exit_code as number;
  const label = exit === 0 ? "ok" : `exit ${exit}`;

  console.log(RULE);
  console.log(`hook: ${name} (${label})${timing(t, t0, lastT)}\n`);

  const output = (event.output as string) ?? "";
  const lines = output.split("\n");
  console.log(lines.slice(0, 3).join("\n"));
  if (lines.length > 3) {
    console.log(`  ... (${lines.length} lines)`);
  }
  console.log("\n");
}

function renderAssistant(event: Record<string, unknown>, t0: number | null, lastT: number | null) {
  const t = event.__t as number | undefined;
  const msg = event.message as Record<string, unknown>;
  const content = (msg?.content as Array<Record<string, unknown>>) ?? [];
  const tag = timing(t, t0, lastT);

  for (const block of content) {
    if (block.type === "thinking") {
      console.log(RULE);
      console.log(`thinking${tag}\n`);
      console.log(block.thinking as string);
      console.log("\n");
    }

    if (block.type === "tool_use") {
      console.log(RULE);
      console.log(`tool: ${block.name}${tag}\n`);
      const input = block.input as Record<string, unknown>;
      for (const [key, val] of Object.entries(input)) {
        const valStr = typeof val === "string" ? val : JSON.stringify(val);
        console.log(`  ${key}: ${valStr}`);
      }
      console.log("\n");
    }

    if (block.type === "text") {
      console.log(RULE);
      console.log(`response${tag}\n`);
      console.log(block.text as string);
      console.log("\n");
    }
  }
}

function renderUser(event: Record<string, unknown>, t0: number | null, lastT: number | null) {
  const t = event.__t as number | undefined;
  const msg = event.message as Record<string, unknown>;
  const content = (msg?.content as Array<Record<string, unknown>>) ?? [];

  for (const block of content) {
    if (block.type !== "tool_result") continue;

    const output = block.content as string ?? "";
    const isError = block.is_error as boolean;
    const prefix = isError ? "✗" : "→";

    console.log(`  ${prefix} result${timing(t, t0, lastT)}:`);
    const lines = output.split("\n");
    if (lines.length <= 15) {
      console.log(output);
    } else {
      console.log(lines.slice(0, 10).join("\n"));
      console.log(`  ... (${lines.length} lines)`);
    }
    console.log("\n");
  }
}

function renderResult(event: Record<string, unknown>) {
  const turns = event.num_turns as number ?? 0;
  const duration = event.duration_ms as number ?? 0;
  const cost = event.total_cost_usd as number ?? 0;
  const stop = event.stop_reason as string ?? "";

  console.log(RULE);
  console.log("summary\n");
  console.log(`${turns} turns · ${(duration / 1000).toFixed(1)}s · $${cost.toFixed(4)} · ${stop}`);
}

// ------------------------------------------------------------------

const file = resolve();
if (file) renderFile(file);
