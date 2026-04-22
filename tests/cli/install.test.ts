import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { runCli } from "../helpers/run-cli";
import { makeTempHome, cleanupTempDir } from "../helpers/fixtures";

describe("install command", () => {
  test("installs skill files", async () => {
    const home = makeTempHome();

    const { exitCode, stdout } = await runCli(["install"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("installed:");
    expect(stdout).toContain("skill");

    // skill routing table exists
    const skillPath = join(home, ".claude", "skills", "mnemo", "SKILL.md");
    expect(existsSync(skillPath)).toBe(true);

    // reference files exist
    const refsDir = join(home, ".claude", "skills", "mnemo", "references");
    expect(existsSync(join(refsDir, "list.md"))).toBe(true);
    expect(existsSync(join(refsDir, "load.md"))).toBe(true);
    expect(existsSync(join(refsDir, "save.md"))).toBe(true);

    cleanupTempDir(home);
  });

  test("stages mnemo-*.md agents for Claude Code discovery", async () => {
    const home = makeTempHome();

    const { exitCode, stdout } = await runCli(["install"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("agents");

    // agents copied with mnemo- prefix for named sub-agent discovery
    const agentsDir = join(home, ".claude", "agents");
    expect(existsSync(join(agentsDir, "mnemo-save.md"))).toBe(true);
    expect(existsSync(join(agentsDir, "mnemo-maintenance.md"))).toBe(true);

    cleanupTempDir(home);
  });

  test("adds session hook to settings.json", async () => {
    const home = makeTempHome();

    const { exitCode, stdout } = await runCli(["install"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("hook");

    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const sessionStart = settings.hooks.SessionStart;

    expect(sessionStart).toBeArray();
    expect(sessionStart.length).toBe(1);
    expect(sessionStart[0].hooks[0].command).toBe("mnemo prime");

    cleanupTempDir(home);
  });

  test("idempotent — second run reports already installed", async () => {
    const home = makeTempHome();

    await runCli(["install"], { home });
    const { exitCode, stdout } = await runCli(["install"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("already installed");

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

    const { exitCode } = await runCli(["install"], { home });

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

    const { exitCode } = await runCli(["install"], { home });

    expect(exitCode).toBe(0);
    expect(existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    expect(settings.hooks.SessionStart).toBeArray();

    cleanupTempDir(home);
  });

  test("installs only what's missing", async () => {
    const home = makeTempHome();

    // first install — everything
    await runCli(["install"], { home });

    // remove only agents, leave skill and hook
    const { rmSync } = await import("fs");
    rmSync(join(home, ".claude", "agents"), { recursive: true, force: true });

    const { exitCode, stdout } = await runCli(["install"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("installed:");
    expect(stdout).toContain("agents");
    // skill and hook were already there — not reinstalled
    expect(stdout).not.toContain("skill");
    expect(stdout).not.toContain("hook");

    // agents are back
    expect(existsSync(join(home, ".claude", "agents", "mnemo-save.md"))).toBe(true);

    cleanupTempDir(home);
  });
});

describe("install --force", () => {
  test("reinstalls everything when confirmed", async () => {
    const home = makeTempHome();

    await runCli(["install"], { home });

    // modify a skill file to verify it gets overwritten
    const skillFile = join(home, ".claude", "skills", "mnemo", "SKILL.md");
    const originalContent = readFileSync(skillFile, "utf-8");
    writeFileSync(skillFile, "modified content", "utf-8");

    const { exitCode, stdout } = await runCli(
      ["install", "--force"],
      { home, stdin: "y\n" },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("this will overwrite:");
    expect(stdout).toContain("installed:");

    // skill file restored to original
    expect(readFileSync(skillFile, "utf-8")).toBe(originalContent);

    cleanupTempDir(home);
  });

  test("does not duplicate hook entry on repeated force install", async () => {
    const home = makeTempHome();

    await runCli(["install", "--force"], { home, stdin: "y\n" });
    await runCli(["install", "--force"], { home, stdin: "y\n" });

    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const sessionStart = settings.hooks.SessionStart;

    expect(sessionStart.length).toBe(1);

    cleanupTempDir(home);
  });

  test("cancels when user declines", async () => {
    const home = makeTempHome();

    await runCli(["install"], { home });

    // modify a skill file
    const skillFile = join(home, ".claude", "skills", "mnemo", "SKILL.md");
    writeFileSync(skillFile, "modified content", "utf-8");

    const { exitCode, stdout } = await runCli(
      ["install", "--force"],
      { home, stdin: "n\n" },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("cancelled.");
    expect(stdout).not.toContain("installed:");

    // skill file unchanged
    expect(readFileSync(skillFile, "utf-8")).toBe("modified content");

    cleanupTempDir(home);
  });
});
