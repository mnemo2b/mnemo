import { CLIError } from "@/core/errors";
import type { Sets } from "@/types/sets";

// -----------------------------------------------------------------------------

/** helpful list of available sets for output */

export function formatSetsHint(sets: Sets): string {
  const names = Object.keys(sets).sort();
  if (names.length === 0) return "";

  const list = names.map((n) => `  ${n}`).join("\n");
  return `\n\nsets:\n${list}`;
}

/** merge global and project sets — project overrides global on collision */

export function mergeSets(global: Sets, project: Sets): Sets {
  const merged = { ...global };

  for (const name of Object.keys(project)) {
    if (merged[name]) {
      console.error(`set "${name}" defined in both global and project config — using project`);
    }
    merged[name] = project[name]!;
  }

  return merged;
}

/** resolve a set name to a list of paths */

export function resolveSet(name: string, sets: Sets): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  expand(name, []);

  return result;

  /** recursively expands set references */

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
      if (entry.startsWith(":")) {
        expand(entry.slice(1), [...chain, current]);
        continue;
      }

      if (!seen.has(entry)) {
        seen.add(entry);
        result.push(entry);
      }
    }
  }
}
