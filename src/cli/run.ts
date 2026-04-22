import { runList } from "./list";
import { runLoad } from "./load";
import { runBase } from "./base";
import { runSet } from "./set";
import { runPrime } from "./prime";
import { runInstall } from "./install";
import { runUninstall } from "./uninstall";
import { runStatus } from "./status";
import { CLIError } from "../core/errors";

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
