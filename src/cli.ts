import { runList } from "./cli/list";
import { runBase } from "./cli/base";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help") {
  console.log("usage: mnemo <list|base> [options]");
  console.log("");
  console.log("commands:");
  console.log("  list [path] [--paths]       browse the knowledge base");
  console.log("  base add <name> <path>      register a knowledge base");
  console.log("  base remove <name>          unregister a knowledge base");
  console.log("  base move <name> <path>     change a base's path");
  console.log("  base rename <old> <new>     rename a base");
  console.log("  base list                   show registered bases");
  process.exit(0);
}

if (command === "base") {
  runBase(args.slice(1));
} else if (command === "list") {
  runList(args.slice(1));
} else {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}
