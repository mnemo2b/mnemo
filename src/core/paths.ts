import { existsSync } from "fs";
import { resolve } from "path";

// ----------------------------------------------------------------------------

/** resolve a path, trying .md extension if the exact path doesn't exist */

export function resolvePath(baseRoot: string, inputPath: string): string {
  const exact = resolve(baseRoot, inputPath);
  if (existsSync(exact)) return exact;

  const withExtension = resolve(baseRoot, inputPath + ".md");
  if (existsSync(withExtension)) return withExtension;

  return exact;
}
