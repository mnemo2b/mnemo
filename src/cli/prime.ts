import { readFileSync } from "fs";
import { loadConfig, loadProjectConfig, mergeSets } from "../core/config";
import { resolveToFiles } from "../core/base";
import { resolveSet } from "../core/set";
import { estimateTokens } from "../core/tokens";
import { formatTokens } from "./format";

/** Count tokens across a list of absolute file paths */
function countTokens(files: string[]): number {
  let total = 0;

  for (const file of files) {
    try {
      const raw = readFileSync(file, "utf-8");
      total += estimateTokens(raw);
    } catch {
      // skip files that can't be read
    }
  }

  return total;
}

export function runPrime(): void {
  const { bases, sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const allSets = mergeSets(globalSets, projectSets);

  const names = Object.keys(allSets).sort();

  if (names.length === 0) {
    return;
  }

  console.log(
    "[mnemo] Present these sets to the user and ask which to load. Do NOT load anything automatically. If the user replies with numbers, run `mnemo load :<set-name>` via Bash (mnemo is a globally installed CLI — do not use npx), then Read each returned file path. If they ignore the menu, proceed with their question.",
  );
  console.log("");

  for (let i = 0; i < names.length; i++) {
    const name = names[i]!;
    const source = name in projectSets ? "project" : "global";

    // resolve set paths to files and count tokens
    let fileCount = 0;
    let tokens = 0;
    try {
      const paths = resolveSet(name, allSets);
      const seen = new Set<string>();
      const files: string[] = [];

      for (const p of paths) {
        for (const f of resolveToFiles(bases, p)) {
          if (!seen.has(f)) {
            seen.add(f);
            files.push(f);
          }
        }
      }

      fileCount = files.length;
      tokens = countTokens(files);
    } catch {
      // set couldn't be resolved — show it with zero counts
    }

    const num = String(i + 1).padStart(2);
    const noteLabel = fileCount === 1 ? "note" : "notes";
    console.log(
      `${num}. ${name} — ${fileCount} ${noteLabel}, ${formatTokens(tokens)} tokens [${source}]`,
    );
  }
}
