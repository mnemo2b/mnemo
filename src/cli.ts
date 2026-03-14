import { runList } from "./cli/list";
import { runLoad } from "./cli/load";
import { runBase } from "./cli/base";
import { runSet } from "./cli/set";
import { runMenu } from "./cli/menu";
import { CLIError } from "./core/errors";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help") {
  console.log("usage: mnemo <list|load|base|set|menu> [options]");
  console.log("");
  console.log("commands:");
  console.log("  list [path]                 browse the knowledge base");
  console.log("  load <path|:set|mixed,...>   resolve paths to absolute files");
  console.log("  menu                        show available sets with token counts");
  console.log("  base add <name> <path>      register a knowledge base");
  console.log("  base remove <name>          unregister a knowledge base");
  console.log("  base move <name> <path>     change a base's path");
  console.log("  base rename <old> <new>     rename a base");
  console.log("  base list                   show registered bases");
  console.log("  set add <name> <paths...>   create or update a set");
  console.log("  set remove <name>           remove a set");
  console.log("  set show <name>             show resolved paths in a set");
  console.log("  set list                    show all sets");
  process.exit(0);
}

try {
  if (command === "base") {
    runBase(args.slice(1));
  } else if (command === "list") {
    runList(args.slice(1));
  } else if (command === "load") {
    runLoad(args.slice(1));
  } else if (command === "set") {
    runSet(args.slice(1));
  } else if (command === "menu") {
    runMenu();
  } else {
    throw new CLIError(`unknown command: ${command}`);
  }
} catch (error) {
  if (error instanceof CLIError) {
    console.error(error.message);
    process.exit(1);
  }
  // unexpected error — show the full stack trace
  console.error(error);
  process.exit(1);
}
