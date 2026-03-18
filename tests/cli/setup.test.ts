import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { runCli } from "../helpers/run-cli";
import { makeTempHome, cleanupTempDir } from "../helpers/fixtures";

describe("setup command", () => {
  test("installs skill files", async () => {
    const home = makeTempHome();

    const { exitCode, stdout } = await runCli(["setup"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("installed skill");

    // skill routing table exists
    const skillPath = join(home, ".claude", "skills", "mnemo", "SKILL.md");
    expect(existsSync(skillPath)).toBe(true);

    // reference files exist
    const refsDir = join(home, ".claude", "skills", "mnemo", "references");
    expect(existsSync(join(refsDir, "list.md"))).toBe(true);
    expect(existsSync(join(refsDir, "load.md"))).toBe(true);
    expect(existsSync(join(refsDir, "start.md"))).toBe(true);

    cleanupTempDir(home);
  });

  test("adds session hook to settings.json", async () => {
    const home = makeTempHome();

    const { exitCode, stdout } = await runCli(["setup"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("added session hook");

    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const sessionStart = settings.hooks.SessionStart;

    expect(sessionStart).toBeArray();
    expect(sessionStart.length).toBe(1);
    expect(sessionStart[0].hooks[0].command).toBe("mnemo prime");

    cleanupTempDir(home);
  });

  test("idempotent — no duplicate hooks on second run", async () => {
    const home = makeTempHome();

    await runCli(["setup"], { home });
    const { exitCode, stdout } = await runCli(["setup"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("session hook already configured");

    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const sessionStart = settings.hooks.SessionStart;

    // still only one entry
    expect(sessionStart.length).toBe(1);

    cleanupTempDir(home);
  });

  test("preserves existing settings", async () => {
    const home = makeTempHome();

    // seed settings with other keys
    const claudeDir = join(home, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({ permissions: { allow: ["Read"] } }, null, 2),
      "utf-8",
    );

    const { exitCode } = await runCli(["setup"], { home });

    expect(exitCode).toBe(0);

    const settings = JSON.parse(
      readFileSync(join(claudeDir, "settings.json"), "utf-8"),
    );

    // original key preserved
    expect(settings.permissions.allow).toEqual(["Read"]);
    // hook added
    expect(settings.hooks.SessionStart).toBeArray();

    cleanupTempDir(home);
  });

  test("creates settings.json when none exists", async () => {
    const home = makeTempHome();

    const settingsPath = join(home, ".claude", "settings.json");
    expect(existsSync(settingsPath)).toBe(false);

    const { exitCode } = await runCli(["setup"], { home });

    expect(exitCode).toBe(0);
    expect(existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    expect(settings.hooks.SessionStart).toBeArray();

    cleanupTempDir(home);
  });
});
