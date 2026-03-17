import { runList } from "./list";
import { runLoad } from "./load";
import { runBase } from "./base";
import { runSet } from "./set";
import { runMenu } from "./menu";
import { runSetup } from "./setup";
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
  } else if (command === "menu") {
    runMenu();
  } else if (command === "setup") {
    runSetup();
  } else {
    throw new CLIError(`unknown command: ${command}`);
  }
}
