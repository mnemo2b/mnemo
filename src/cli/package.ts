import { existsSync, readFileSync, realpathSync } from "fs";
import { join, dirname } from "path";

// -----------------------------------------------------------------------------

/** walk up from the CLI entry point (dist) to find the package root */

export function findPackageRoot(): string {
  // resolve symlinks and start from the real location
  let dir = dirname(realpathSync(process.argv[1]!));
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  const message = "couldn't find package root — try reinstalling with npm install -g @mnemo2b/mnemo";
  throw new Error(message);
}

/** read the version from package.json */

export function readVersion(): string {
  const pkgPath = join(findPackageRoot(), "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return typeof pkg.version === "string" ? pkg.version : "unknown";
}
