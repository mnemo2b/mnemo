import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { homedir } from "os";
import { parse, stringify } from "yaml";

export const CONFIG_PATH = resolve(homedir(), ".config/mnemo/config.yml");

export type Bases = Record<string, string>;

/** Expand ~ to home directory and resolve to absolute path */
function expandPath(path: string): string {
  const expanded = path.startsWith("~") ? path.replace("~", homedir()) : path;
  return resolve(expanded);
}

/** Replace home directory with ~ for display */
export function shortenPath(path: string): string {
  const home = homedir();
  return path.startsWith(home) ? path.replace(home, "~") : path;
}

/** Read named bases from ~/.config/mnemo/config.yml */
export function loadConfig(): { bases: Bases } {
  if (!existsSync(CONFIG_PATH)) {
    return { bases: {} };
  }

  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const config = parse(raw);

  // no bases key — could be old root: format or empty file
  if (!config?.bases || typeof config.bases !== "object") {
    return { bases: {} };
  }

  const bases: Bases = {};
  for (const [name, path] of Object.entries(config.bases)) {
    if (typeof path !== "string") {
      throw new Error(`invalid path for base "${name}" in ${CONFIG_PATH}`);
    }
    bases[name] = expandPath(path);
  }

  return { bases };
}

/** Write bases config to ~/.config/mnemo/config.yml */
export function saveConfig(bases: Bases): void {
  // store paths with ~ for readability
  const shortBases: Record<string, string> = {};
  for (const [name, absolutePath] of Object.entries(bases)) {
    shortBases[name] = shortenPath(absolutePath);
  }

  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, stringify({ bases: shortBases }), "utf-8");
}
