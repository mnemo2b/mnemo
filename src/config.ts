import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { parse } from "yaml";

const CONFIG_PATH = resolve(homedir(), ".config/mnemo/config.yml");

/** Read the knowledge base root path from ~/.config/mnemo/config.yml */
export function loadConfig(): { root: string } {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const config = parse(raw);

  if (!config?.root || typeof config.root !== "string") {
    throw new Error(`missing "root" directory in ${CONFIG_PATH}`);
  }

  const root = config.root.startsWith("~")
    ? config.root.replace("~", homedir())
    : config.root;

  return { root: resolve(root) };
}
