import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { runCli } from "../helpers/cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

// ----------------------------------------------------------------------------

describe("uninstall command", () => {

  let home: string;

  beforeEach(() => {
    home = makeTempHome();
  });

  afterEach(() => {
    cleanupTempDir(home);
  });

  test("removes skill directory", async () => {
    await runCli(["install"], { home });
    const skillDir = join(home, ".claude", "skills", "mnemo");
    expect(existsSync(skillDir)).toBe(true);

    const { exitCode, stdout } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("mnemo uninstalled.");
    expect(stdout).toContain("skill");
    expect(stdout).toContain("(removed)");
    expect(existsSync(skillDir)).toBe(false);
  });

  test("removes staged mnemo-*.md agents but preserves other agents", async () => {
    await runCli(["install"], { home });
    const agentsDir = join(home, ".claude", "agents");

    // drop a non-mnemo agent to verify selective removal
    writeFileSync(join(agentsDir, "other-tool.md"), "other agent\n", "utf-8");

    const { exitCode, stdout } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("agents");
    expect(stdout).toContain("(removed)");

    // mnemo-*.md gone, other-tool.md still there
    expect(existsSync(join(agentsDir, "mnemo-save.md"))).toBe(false);
    expect(existsSync(join(agentsDir, "mnemo-maintenance.md"))).toBe(false);
    expect(existsSync(join(agentsDir, "other-tool.md"))).toBe(true);
  });

  test("removes hook from settings.json", async () => {
    await runCli(["install"], { home });
    const { exitCode } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);

    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    const sessionStart = settings.hooks.SessionStart;

    expect(sessionStart).toBeArray();
    expect(sessionStart.length).toBe(0);
  });

  test("removes config directory", async () => {
    seedConfig(home, { bases: { test: FIXTURES_DIR } });
    const configDir = join(home, ".config", "mnemo");
    expect(existsSync(configDir)).toBe(true);

    const { exitCode, stdout } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("config");
    expect(stdout).toContain("(removed)");
    expect(existsSync(configDir)).toBe(false);
  });

  test("preserves other settings when removing hook", async () => {
    const claudeDir = join(home, ".claude");
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify(
        {
          permissions: { allow: ["Read"] },
          hooks: {
            SessionStart: [
              {
                matcher: "",
                hooks: [{ type: "command", command: "mnemo prime" }],
              },
              {
                matcher: "*.py",
                hooks: [{ type: "command", command: "other-tool" }],
              },
            ],
          },
        },
        null,
        2,
      ),
      "utf-8",
    );

    const { exitCode } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);

    const settings = JSON.parse(
      readFileSync(join(claudeDir, "settings.json"), "utf-8"),
    );

    // other settings preserved
    expect(settings.permissions.allow).toEqual(["Read"]);
    // only mnemo hook removed
    expect(settings.hooks.SessionStart.length).toBe(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("other-tool");
  });

  test("idempotent — second uninstall shows not found", async () => {
    await runCli(["install"], { home });
    await runCli(["uninstall"], { home });
    const { exitCode, stdout } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("(not found)");
  });

  test("no prior install — all not found", async () => {
    const { exitCode, stdout } = await runCli(["uninstall"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("mnemo uninstalled.");
    // all four lines (skill, agents, hook, config) should say not found
    const notFoundCount = (stdout.match(/\(not found\)/g) || []).length;
    expect(notFoundCount).toBe(4);
  });

});
