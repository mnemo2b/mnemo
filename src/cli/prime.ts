import { readFileSync } from "fs";
import { loadConfig, loadProjectConfig, mergeSets, shortenPath } from "../core/config";
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

/** Case 1: user has sets — show numbered list for selection */
function primeSets(
  bases: Record<string, string>,
  allSets: Record<string, string[]>,
  projectSets: Record<string, string[]>,
): void {
  const names = Object.keys(allSets).sort();

  console.log(
    "[mnemo] Present these sets to the user and ask which to load. " +
    "If they reply with numbers, run `mnemo load :<set-name>` via Bash (mnemo is a globally installed CLI), then Read each returned file path. " +
    "To preview a set's contents, run `mnemo set show <name>`. " +
    "If they ignore the sets, proceed with their question.",
  );
  console.log("");

  for (let i = 0; i < names.length; i++) {
    const name = names[i]!;
    const source = name in projectSets ? "project" : "global";

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

/** Case 2: user has bases but no sets — show bases and usage tips */
function primeBases(bases: Record<string, string>): void {
  const firstBase = Object.keys(bases).sort()[0]!;

  console.log(
    "[mnemo] The user has knowledge bases but no sets yet. " +
    `Show them their bases. They can browse with \`mnemo list ${firstBase}\` or load notes with \`mnemo load ${firstBase}/path\`. ` +
    "To create a set for quick access: `mnemo set add <name> <paths...>`.",
  );
  console.log("");
  console.log("bases:");
  for (const [name, path] of Object.entries(bases).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${name} — ${shortenPath(path)}`);
  }
}

export function runPrime(): void {
  const { bases, sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const allSets = mergeSets(globalSets, projectSets);

  const hasBases = Object.keys(bases).length > 0;
  const hasSets = Object.keys(allSets).length > 0;

  if (hasSets) {
    primeSets(bases, allSets, projectSets);
  } else if (hasBases) {
    primeBases(bases);
  }
  // case 3: no bases, no sets — stay silent
}
