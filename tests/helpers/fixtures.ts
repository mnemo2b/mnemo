import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resolve } from "path";
import { stringify } from "yaml";

// absolute path to the static fixture notes directory
export const FIXTURES_DIR = resolve(import.meta.dir, "../fixtures/notes");

/** Create a temp directory that acts as an isolated HOME */
export function makeTempHome(): string {
  return mkdtempSync(join(tmpdir(), "mnemo-test-"));
}

/** Seed a temp HOME with a mnemo config file */
export function seedConfig(
  home: string,
  config: { bases?: Record<string, string>; sets?: Record<string, string[]> },
): void {
  const configDir = join(home, ".config", "mnemo");
  mkdirSync(configDir, { recursive: true });

  const output: Record<string, unknown> = {};
  if (config.bases) output.bases = config.bases;
  if (config.sets) output.sets = config.sets;

  writeFileSync(join(configDir, "config.yml"), stringify(output), "utf-8");
}

/** Remove a temp directory and all its contents */
export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
