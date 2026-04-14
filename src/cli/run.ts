import { runList } from "./list";
import { runLoad } from "./load";
import { runBase } from "./base";
import { runSet } from "./set";
import { runPrime } from "./prime";
import { runSetup } from "./setup";
import { runTeardown } from "./teardown";
import { runDoctor } from "./doctor";
import { CLIError } from "../core/errors";

/** Dispatch a command to the appropriate handler */
export function runCommand(command: string, args: string[]): void {
  if (command === "base") {
    runBase(args);
  } else if (command === "list") {
    runList(args);
  } else if (command === "load") {
    runLoad(args);
  } else if (command === "set") {
    runSet(args);
  } else if (command === "prime") {
    runPrime();
  } else if (command === "setup") {
    runSetup();
  } else if (command === "teardown") {
    runTeardown();
  } else if (command === "doctor") {
    runDoctor();
  } else {
    throw new CLIError(`unknown command: ${command}`);
  }
}
