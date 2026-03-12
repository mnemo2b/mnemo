import { existsSync } from "fs";
import { resolve } from "path";

/** Resolve a path, trying .md extension if the exact path doesn't exist */
export function resolvePath(kbRoot: string, inputPath: string): string {
  const exact = resolve(kbRoot, inputPath);
  if (existsSync(exact)) return exact;

  const withExtension = resolve(kbRoot, inputPath + ".md");
  if (existsSync(withExtension)) return withExtension;

  return exact;
}
