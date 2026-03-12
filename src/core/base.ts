import { resolvePath } from "./resolve-path";

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
    throw new Error(`unknown base: ${baseName}`);
  }

  // no relative path means the caller wants the base root itself
  if (!relativePath) {
    return baseRoot;
  }

  return resolvePath(baseRoot, relativePath);
}
