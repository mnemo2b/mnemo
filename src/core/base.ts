import { existsSync, statSync } from "fs";
import { CLIError } from "@/core/errors";
import { resolvePath, shortenPath } from "@/core/paths";
import { collectFiles } from "@/core/scan";
import type { Bases } from "@/types/bases";

// -----------------------------------------------------------------------------

interface ParsedBasePath {
  baseName: string;
  relativePath: string | null;
}

// -----------------------------------------------------------------------------

/** list of bases for error output */

export function formatBasesHint(bases: Bases): string {
  const entries = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "";

  const list = entries.map(([name, path]) => `  ${name}: ${shortenPath(path)}`).join("\n");
  return `\n\nbases:\n${list}`;
}

/** split a base-prefixed path into base name and relative path */

export function parseBasePath(input: string): ParsedBasePath {
  const slashIndex = input.indexOf("/");

  if (slashIndex === -1) {
    return { baseName: input, relativePath: null };
  }

  return {
    baseName: input.slice(0, slashIndex),
    relativePath: input.slice(slashIndex + 1),
  };
}

/** resolve a base-prefixed path to an absolute path */

export function resolveBasePath(
  bases: Bases,
  input: string,
): string {
  const { baseName, relativePath } = parseBasePath(input);
  const baseRoot = bases[baseName];

  if (!baseRoot) {
    throw new CLIError(`unknown base: "${baseName}"${formatBasesHint(bases)}`);
  }

  if (!relativePath) {
    return baseRoot;
  }

  return resolvePath(baseRoot, relativePath);
}

/** resolve a base-prefixed path to absolute paths, returns [] if not found */

export function resolveToFiles(bases: Bases, path: string): string[] {
  const absolute = resolveBasePath(bases, path);

  if (!existsSync(absolute)) return [];
  if (statSync(absolute).isDirectory()) return collectFiles(absolute);
  return [absolute];
}
