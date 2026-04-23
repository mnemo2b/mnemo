import { runCommand } from "@/cli/run";
import { readVersion } from "@/cli/package";
import { CLIError } from "@/core/errors";

// -----------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0];

// -----------------------------------------------------------------------------

if (!command || command === "--help") {
  console.log("usage: mnemo <list|load|base|set|install|uninstall|status> [options]");
  console.log("");
  console.log("commands:");
  console.log("  list [path]               browse the knowledge base");
  console.log("  load <path|:set ...>      resolve paths to absolute files");
  console.log("  prime                     teaches agents about mnemo");
  console.log("  base add <name> <path>    register a knowledge base");
  console.log("  base remove <name>        unregister a knowledge base");
  console.log("  base move <name> <path>   change a base's path");
  console.log("  base rename <old> <new>   rename a base");
  console.log("  base list                 show registered bases");
  console.log("  set add <name> <paths...> create or update a set");
  console.log("  set remove <name>         remove a set");
  console.log("  set rename <old> <new>    rename a set");
  console.log("  set show <name>           show paths in a set");
  console.log("  set list                  show all sets");
  console.log("  install [--force]          install skill + agents + session hook");
  console.log("  uninstall                 remove skill + agents + session hook + config");
  console.log("  status                    check install state and knowledge bases");
  process.exit(0);
}

// -----------------------------------------------------------------------------

if (command === "--version" || command === "-v") {
  console.log(readVersion());
  process.exit(0);
}

// -----------------------------------------------------------------------------

try {
  await runCommand(command, args.slice(1));
} catch (error) {
  if (error instanceof CLIError) {
    console.error(error.message);
    process.exit(1);
  }
  // unexpected errors
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
}
