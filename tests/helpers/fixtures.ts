import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { stringify } from "yaml";
import type { Bases } from "@/types/bases";
import type { Sets } from "@/types/sets";

// ----------------------------------------------------------------------------

export const FIXTURES_DIR = resolve(import.meta.dir, "../fixtures/notes");

// ----------------------------------------------------------------------------

/** remove a temp directory */

export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** create a temp home directory */

export function makeTempHome(): string {
  return mkdtempSync(join(tmpdir(), "mnemo-test-"));
}

/** seed the temp home directory with a mnemo config file */

export function seedConfig(
  home: string,
  config: { bases?: Bases; sets?: Sets },
): void {
  const configDir = join(home, ".config", "mnemo");
  mkdirSync(configDir, { recursive: true });

  const output: Record<string, unknown> = {};
  if (config.bases) output.bases = config.bases;
  if (config.sets) output.sets = config.sets;

  writeFileSync(join(configDir, "config.yml"), stringify(output), "utf-8");
}
