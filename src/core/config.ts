import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { homedir } from "os";
import { parse, stringify } from "yaml";
import { CLIError } from "./errors";
import type { Bases } from "../types/bases";
import type { Sets } from "../types/sets";
import type { Config, ProjectConfig } from "../types/config";

// ----------------------------------------------------------------------------

export const CONFIG_PATH =
  process.env.MNEMO_CONFIG ?? resolve(homedir(), ".config/mnemo/config.yml");

// ----------------------------------------------------------------------------

/** read global config from ~/.config/mnemo/config.yml */

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    return { bases: {}, sets: {} };
  }

  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const config = parse(raw);

  if (!config || typeof config !== "object") {
    return { bases: {}, sets: {} };
  }

  const bases: Bases = {};
  if (config.bases && typeof config.bases === "object") {
    for (const [name, path] of Object.entries(config.bases)) {
      if (typeof path !== "string") {
        throw new CLIError(`invalid path for base "${name}" in ${CONFIG_PATH}`);
      }
      bases[name] = expandPath(path);
    }
  }

  const sets = parseSets(config.sets);

  return { bases, sets };
}

/** read project config from .mnemo in the given directory */

export function loadProjectConfig(cwd: string): ProjectConfig {
  const configPath = join(cwd, ".mnemo");

  if (!existsSync(configPath)) {
    return { sets: {} };
  }

  const raw = readFileSync(configPath, "utf-8");
  const config = parse(raw);

  if (!config || typeof config !== "object") {
    return { sets: {} };
  }

  const sets = parseSets(config.sets);

  return { sets };
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

/** write a partial config update — reads current config, merges, writes back */

export function saveConfig(update: Partial<Config>): void {
  const current = loadConfig();

  const bases = update.bases ?? current.bases;
  const shortBases: Record<string, string> = {};
  for (const [name, absolutePath] of Object.entries(bases)) {
    shortBases[name] = shortenPath(absolutePath);
  }

  const sets = update.sets ?? current.sets;

  const output: Record<string, unknown> = { bases: shortBases };
  if (Object.keys(sets).length > 0) {
    output.sets = sets;
  }

  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, stringify(output), "utf-8");
}

/** replace home directory with ~ for display */

export function shortenPath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? path.replace(home, "~") : path;
}

/** expand ~ to home directory and resolve to absolute path */

function expandPath(path: string): string {
  const expanded = path.startsWith("~") ? path.replace("~", homedir()) : path;
  return resolve(expanded);
}

/** parse a raw sets object from yaml into a validated Sets record */

function parseSets(raw: unknown): Sets {
  if (!raw || typeof raw !== "object") return {};

  const sets: Sets = {};
  for (const [name, entries] of Object.entries(raw)) {
    if (!Array.isArray(entries)) continue;
    sets[name] = entries.filter((e) => typeof e === "string");
  }
  return sets;
}
