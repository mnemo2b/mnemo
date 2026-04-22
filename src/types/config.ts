import type { Bases } from "./bases";
import type { Sets } from "./sets";

export interface Config {
  bases: Bases;
  sets: Sets;
}

export interface ProjectConfig {
  sets: Sets;
}
