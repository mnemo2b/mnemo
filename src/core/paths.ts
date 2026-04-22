import { existsSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

// ----------------------------------------------------------------------------

/** expand ~ to home directory and resolve to absolute path */

export function expandPath(path: string): string {
  const expanded = path.startsWith("~") ? path.replace("~", homedir()) : path;
  return resolve(expanded);
}

/** resolve a path, trying .md extension if the exact path doesn't exist */

export function resolvePath(baseRoot: string, inputPath: string): string {
  const exact = resolve(baseRoot, inputPath);
  if (existsSync(exact)) return exact;

  const withExtension = resolve(baseRoot, inputPath + ".md");
  if (existsSync(withExtension)) return withExtension;

  return exact;
}

/** replace home directory with ~ for display */

export function shortenPath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? path.replace(home, "~") : path;
}
