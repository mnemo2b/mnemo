import { mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const testConfigDir = mkdtempSync(join(tmpdir(), "mnemo-test-"));
process.env.MNEMO_CONFIG = join(testConfigDir, "config.yml");
