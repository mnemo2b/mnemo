import { CLIError } from "./errors";

export type Sets = Record<string, string[]>;

/** Format a "sets:" hint listing available set names */
export function formatSetsHint(sets: Sets): string {
  const names = Object.keys(sets).sort();
  if (names.length === 0) return "";
  const list = names.map((n) => `  ${n}`).join("\n");
  return `\n\nsets:\n${list}`;
}

/** Resolve a set name to a flat, deduplicated list of base-prefixed paths */
export function resolveSet(name: string, sets: Sets): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  expand(name, []);

  return result;

  function expand(current: string, chain: string[]): void {
    if (chain.includes(current)) {
      const cycle = [...chain, current].map((s) => `:${s}`).join(" → ");
      throw new CLIError(`circular set reference: ${cycle}`);
    }

    const entries = sets[current];
    if (!entries) {
      throw new CLIError(`unknown set: "${current}"${formatSetsHint(sets)}`);
    }

    for (const entry of entries) {
      // set reference — recurse
      if (entry.startsWith(":")) {
        expand(entry.slice(1), [...chain, current]);
        continue;
      }

      // base-prefixed path — deduplicate and collect
      if (!seen.has(entry)) {
        seen.add(entry);
        result.push(entry);
      }
    }
  }
}
