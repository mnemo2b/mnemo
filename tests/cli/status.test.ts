import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { runCli } from "../helpers/cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

// ----------------------------------------------------------------------------

describe("status command", () => {

  let home: string;

  beforeEach(() => {
    home = makeTempHome();
  });

  afterEach(() => {
    cleanupTempDir(home);
  });

  test("fresh home — reports everything missing and exits 1", async () => {
    const { exitCode, stdout } = await runCli(["status"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("cli");
    expect(stdout).toContain("config");
    expect(stdout).toContain("none registered");
    expect(stdout).toContain("skill");
    expect(stdout).toContain("agents");
    expect(stdout).toContain("hook");
    // remediation pointer
    expect(stdout).toContain("mnemo install");
  });

  test("after base add — reports healthy and exits 0", async () => {
    await runCli(["base", "add", "notes", FIXTURES_DIR], { home });

    const { exitCode, stdout } = await runCli(["status"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("notes");
    expect(stdout).not.toContain("none registered");
    // no remediation pointer when healthy
    expect(stdout).not.toContain("mnemo install");
  });

  test("base pointing to nonexistent path — flagged and exits 1", async () => {
    // register a base via config seed so we skip the existence check in base add
    seedConfig(home, { bases: { broken: "/nonexistent/path" } });
    // still need skill + hook so those don't also fail
    await runCli(["install"], { home });

    const { exitCode, stdout } = await runCli(["status"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("broken");
    expect(stdout).toContain("path does not exist");
  });

  test("skill + hook present but agents missing — flagged and exits 1", async () => {
    await runCli(["install"], { home });

    // simulate user deleting the staged agents
    rmSync(join(home, ".claude", "agents"), { recursive: true, force: true });

    const { exitCode, stdout } = await runCli(["status"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("agents");
    expect(stdout).toContain("missing");
  });

  test("one of two agents missing — flagged and names the missing file", async () => {
    await runCli(["install"], { home });

    // simulate a half-broken install — remove only the maintenance agent
    rmSync(join(home, ".claude", "agents", "mnemo-maintenance.md"));

    const { exitCode, stdout } = await runCli(["status"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("agents");
    expect(stdout).toContain("mnemo-maintenance.md");
  });

  test("skill present but hook removed — flagged and exits 1", async () => {
    // install sets up both skill and hook
    await runCli(["install"], { home });

    // simulate the user hand-editing settings.json to remove the hook entry
    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    settings.hooks.SessionStart = [];
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");

    const { exitCode, stdout } = await runCli(["status"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("hook");
    expect(stdout).toContain("missing");
  });

});
