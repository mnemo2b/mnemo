import { mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// isolate config tests from the user's real config
const testConfigDir = mkdtempSync(join(tmpdir(), "mnemo-test-"));
process.env.MNEMO_CONFIG = join(testConfigDir, "config.yml");
