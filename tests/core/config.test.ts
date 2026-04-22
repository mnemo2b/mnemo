import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { stringify, parse } from "yaml";
import {
  loadConfig,
  saveConfig,
  loadProjectConfig,
  CONFIG_PATH,
} from "@/core/config";
import { CLIError } from "@/core/errors";
import { makeTempHome, cleanupTempDir } from "../helpers/fixtures";

// ----------------------------------------------------------------------------

describe("loadConfig", () => {

  beforeEach(() => {
    rmSync(CONFIG_PATH, { force: true });
  });

  test("returns empty config when file does not exist", () => {
    const config = loadConfig();

    expect(config).toEqual({ bases: {}, sets: {} });
  });

  test("parses bases from yaml", () => {
    writeConfig({ bases: { notes: "/tmp/notes" } });

    const config = loadConfig();

    expect(config.bases.notes).toBe("/tmp/notes");
  });

  test("expands tilde in base paths", () => {
    writeConfig({ bases: { notes: "~/notes" } });

    const config = loadConfig();

    expect(config.bases.notes).not.toContain("~");
    expect(config.bases.notes).toContain("notes");
  });

  test("parses sets from yaml", () => {
    writeConfig({ sets: { react: ["base/react", "base/hooks"] } });

    const config = loadConfig();

    expect(config.sets.react).toEqual(["base/react", "base/hooks"]);
  });

  test("returns empty config for malformed yaml (non-object)", () => {
    mkdirSync(dirname(CONFIG_PATH), { recursive: true });
    writeFileSync(CONFIG_PATH, "just a string\n", "utf-8");

    const config = loadConfig();

    expect(config).toEqual({ bases: {}, sets: {} });
  });

  test("returns empty config for empty yaml file", () => {
    mkdirSync(dirname(CONFIG_PATH), { recursive: true });
    writeFileSync(CONFIG_PATH, "", "utf-8");

    const config = loadConfig();

    expect(config).toEqual({ bases: {}, sets: {} });
  });

  test("throws CLIError for non-string base path", () => {
    writeConfig({ bases: { broken: 123 } });

    expect(() => loadConfig()).toThrow(CLIError);
    expect(() => loadConfig()).toThrow(/invalid path for base "broken"/);
  });

  test("skips non-array set entries", () => {
    writeConfig({ sets: { valid: ["a", "b"], invalid: "not-an-array" } });

    const config = loadConfig();

    expect(config.sets.valid).toEqual(["a", "b"]);
    expect(config.sets.invalid).toBeUndefined();
  });

  test("filters non-string entries from set arrays", () => {
    writeConfig({ sets: { mixed: ["valid", 123, "also-valid", null] } });

    const config = loadConfig();

    expect(config.sets.mixed).toEqual(["valid", "also-valid"]);
  });

  test("handles config with no bases key", () => {
    writeConfig({ sets: { react: ["base/react"] } });

    const config = loadConfig();

    expect(config.bases).toEqual({});
    expect(config.sets.react).toEqual(["base/react"]);
  });

  test("handles config with no sets key", () => {
    writeConfig({ bases: { notes: "/tmp/notes" } });

    const config = loadConfig();

    expect(config.bases.notes).toBe("/tmp/notes");
    expect(config.sets).toEqual({});
  });

});

describe("loadProjectConfig", () => {

  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempHome();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test("returns empty sets when .mnemo does not exist", () => {
    const config = loadProjectConfig(tempDir);

    expect(config).toEqual({ sets: {} });
  });

  test("parses sets from .mnemo file", () => {
    writeFileSync(
      join(tempDir, ".mnemo"),
      stringify({ sets: { react: ["base/react"] } }),
      "utf-8",
    );

    const config = loadProjectConfig(tempDir);

    expect(config.sets.react).toEqual(["base/react"]);
  });

  test("returns empty sets for malformed .mnemo", () => {
    writeFileSync(join(tempDir, ".mnemo"), "just a string\n", "utf-8");

    const config = loadProjectConfig(tempDir);

    expect(config).toEqual({ sets: {} });
  });

  test("returns empty sets for empty .mnemo", () => {
    writeFileSync(join(tempDir, ".mnemo"), "", "utf-8");

    const config = loadProjectConfig(tempDir);

    expect(config).toEqual({ sets: {} });
  });

  test("skips non-array set entries", () => {
    writeFileSync(
      join(tempDir, ".mnemo"),
      stringify({ sets: { valid: ["a"], invalid: "string" } }),
      "utf-8",
    );

    const config = loadProjectConfig(tempDir);

    expect(config.sets.valid).toEqual(["a"]);
    expect(config.sets.invalid).toBeUndefined();
  });

});

describe("saveConfig", () => {

  beforeEach(() => {
    rmSync(CONFIG_PATH, { force: true });
  });

  test("creates config file and parent directories", () => {
    rmSync(dirname(CONFIG_PATH), { recursive: true, force: true });

    saveConfig({ bases: { notes: "/tmp/notes" } });

    expect(existsSync(CONFIG_PATH)).toBe(true);
  });

  test("shortens home directory to tilde in saved paths", () => {
    const home = process.env.HOME!;

    saveConfig({ bases: { notes: `${home}/notes` } });

    const raw = readFileSync(CONFIG_PATH, "utf-8");
    expect(raw).toContain("~/notes");
    expect(raw).not.toContain(home);
  });

  test("omits sets key when no sets exist", () => {
    saveConfig({ bases: { notes: "/tmp/notes" } });

    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = parse(raw);
    expect(parsed.sets).toBeUndefined();
  });

  test("includes sets key when sets exist", () => {
    saveConfig({ bases: {}, sets: { react: ["base/react"] } });

    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = parse(raw);
    expect(parsed.sets.react).toEqual(["base/react"]);
  });

  test("merges partial update with existing config", () => {
    saveConfig({ bases: { notes: "/tmp/notes" }, sets: { react: ["base/react"] } });
    saveConfig({ bases: { notes: "/tmp/notes", work: "/tmp/work" } });

    const config = loadConfig();

    expect(config.bases.notes).toBe("/tmp/notes");
    expect(config.bases.work).toBe("/tmp/work");
    expect(config.sets.react).toEqual(["base/react"]);
  });

  test("roundtrips bases and sets through save/load", () => {
    const bases = { notes: "/tmp/notes", work: "/tmp/work" };
    const sets = { dev: ["notes/dev", "work/tasks"] };

    saveConfig({ bases, sets });
    const loaded = loadConfig();

    expect(loaded.bases).toEqual(bases);
    expect(loaded.sets).toEqual(sets);
  });

});

// ----------------------------------------------------------------------------

/** write a yaml config to the test CONFIG_PATH */

function writeConfig(config: Record<string, unknown>): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, stringify(config), "utf-8");
}
