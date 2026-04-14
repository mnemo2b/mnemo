import { describe, expect, test } from "bun:test";
import { runCli } from "../helpers/run-cli";
import {
  makeTempHome,
  seedConfig,
  cleanupTempDir,
  FIXTURES_DIR,
} from "../helpers/fixtures";

describe("doctor command", () => {
  test("fresh home — reports everything missing and exits 1", async () => {
    const home = makeTempHome();

    const { exitCode, stdout } = await runCli(["doctor"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("cli");
    expect(stdout).toContain("config");
    expect(stdout).toContain("none registered");
    expect(stdout).toContain("skill");
    expect(stdout).toContain("hook");
    // remediation pointer
    expect(stdout).toContain("mnemo setup");

    cleanupTempDir(home);
  });

  test("after base add — reports healthy and exits 0", async () => {
    const home = makeTempHome();

    await runCli(["base", "add", "notes", FIXTURES_DIR], { home });

    const { exitCode, stdout } = await runCli(["doctor"], { home });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("notes");
    expect(stdout).not.toContain("none registered");
    // no remediation pointer when healthy
    expect(stdout).not.toContain("mnemo setup");

    cleanupTempDir(home);
  });

  test("base pointing to nonexistent path — flagged and exits 1", async () => {
    const home = makeTempHome();

    // register a base via config seed so we skip the existence check in base add
    seedConfig(home, { bases: { broken: "/nonexistent/path" } });
    // still need skill + hook so those don't also fail
    await runCli(["setup"], { home });

    const { exitCode, stdout } = await runCli(["doctor"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("broken");
    expect(stdout).toContain("path does not exist");

    cleanupTempDir(home);
  });

  test("skill present but hook removed — flagged and exits 1", async () => {
    const home = makeTempHome();

    // setup installs both skill and hook
    await runCli(["setup"], { home });

    // simulate the user hand-editing settings.json to remove the hook entry
    const { readFileSync, writeFileSync } = await import("fs");
    const { join } = await import("path");
    const settingsPath = join(home, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    settings.hooks.SessionStart = [];
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");

    const { exitCode, stdout } = await runCli(["doctor"], { home });

    expect(exitCode).toBe(1);
    expect(stdout).toContain("hook");
    expect(stdout).toContain("missing");

    cleanupTempDir(home);
  });
});
