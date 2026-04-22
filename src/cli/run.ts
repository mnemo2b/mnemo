import { runList } from "@/cli/list";
import { runLoad } from "@/cli/load";
import { runBase } from "@/cli/base";
import { runSet } from "@/cli/set";
import { runPrime } from "@/cli/prime";
import { runInstall } from "@/cli/install";
import { runUninstall } from "@/cli/uninstall";
import { runStatus } from "@/cli/status";
import { CLIError } from "@/core/errors";

// -----------------------------------------------------------------------------

/** dispatch commands to appropriate handlers */

export function runCommand(command: string, args: string[]): void | Promise<void> {
  switch (command) {
    case "base": return runBase(args);
    case "list": return runList(args);
    case "load": return runLoad(args);
    case "set": return runSet(args);
    case "prime": return runPrime();
    case "install": return runInstall(args);
    case "uninstall": return runUninstall();
    case "status": return runStatus();
    default: throw new CLIError(`unknown command: ${command}`);
  }
}
