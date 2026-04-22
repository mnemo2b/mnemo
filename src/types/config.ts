import type { Bases } from "@/types/bases";
import type { Sets } from "@/types/sets";

export interface Config {
  bases: Bases;
  sets: Sets;
}

export interface ProjectConfig {
  sets: Sets;
}
