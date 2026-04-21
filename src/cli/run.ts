import { runList } from "./list";
import { runLoad } from "./load";
import { runBase } from "./base";
import { runSet } from "./set";
import { runPrime } from "./prime";
import { runSetup } from "./setup";
import { runTeardown } from "./teardown";
import { runDoctor } from "./doctor";
import { CLIError } from "../core/errors";

// -----------------------------------------------------------------------------

/** Dispatch commands to appropriate handlers */
export function runCommand(command: string, args: string[]): void {
  switch (command) {
    case "base": return runBase(args);
    case "list": return runList(args);
    case "load": return runLoad(args);
    case "set": return runSet(args);
    case "prime": return runPrime();
    case "setup": return runSetup();
    case "teardown": return runTeardown();
    case "doctor": return runDoctor();
    default: throw new CLIError(`unknown command: ${command}`);
  }
}
