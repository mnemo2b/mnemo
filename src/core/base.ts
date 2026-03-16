import { existsSync, statSync } from "fs";
import { CLIError } from "./errors";
import { shortenPath } from "./config";
import { resolvePath } from "./resolve-path";
import { collectFiles } from "./scan";

/** Format a "bases:" hint listing registered bases with shortened paths */
export function formatBasesHint(bases: Record<string, string>): string {
  const entries = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "";
  const list = entries.map(([name, path]) => `  ${name}: ${shortenPath(path)}`).join("\n");
  return `\n\nbases:\n${list}`;
}

export interface ParsedBasePath {
  baseName: string;
  relativePath: string | null;
}

/** Split a base-prefixed path into base name and relative path */
export function parseBasePath(input: string): ParsedBasePath {
  const slashIndex = input.indexOf("/");

  // no slash means the input is just a base name
  if (slashIndex === -1) {
    return { baseName: input, relativePath: null };
  }

  return {
    baseName: input.slice(0, slashIndex),
    relativePath: input.slice(slashIndex + 1),
  };
}

/** Resolve a base-prefixed path to an absolute filesystem path */
export function resolveBasePath(
  bases: Record<string, string>,
  input: string,
): string {
  const { baseName, relativePath } = parseBasePath(input);
  const baseRoot = bases[baseName];

  if (!baseRoot) {
    throw new CLIError(`unknown base: "${baseName}"${formatBasesHint(bases)}`);
  }

  // no relative path means the caller wants the base root itself
  if (!relativePath) {
    return baseRoot;
  }

  return resolvePath(baseRoot, relativePath);
}

/** Resolve a base-prefixed path to absolute file paths, returns [] if not found */
export function resolveToFiles(bases: Record<string, string>, path: string): string[] {
  const absolute = resolveBasePath(bases, path);

  if (!existsSync(absolute)) return [];
  if (statSync(absolute).isDirectory()) return collectFiles(absolute);
  return [absolute];
}
