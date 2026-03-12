import { readdirSync, statSync, existsSync } from "fs";
import { join, resolve, dirname, relative, basename } from "path";
import { loadConfig } from "./config";

// --- directory traversal ---

interface TreeEntry {
  name: string;
  type: "directory" | "file";
  depth: number;
  absolutePath: string;
}

/** recursively collect directories and markdown files */
function collectTree(dir: string, depth: number): TreeEntry[] {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."));

  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const results: TreeEntry[] = [];

  for (const d of dirs) {
    const fullPath = join(dir, d.name);
    results.push({ name: d.name, type: "directory", depth, absolutePath: fullPath });
    results.push(...collectTree(fullPath, depth + 1));
  }

  for (const f of files) {
    const fullPath = join(dir, f.name);
    results.push({ name: f.name, type: "file", depth, absolutePath: fullPath });
  }

  return results;
}

/** resolve a path, trying .md extension if the exact path doesn't exist */
function resolvePath(kbRoot: string, inputPath: string): string {
  const exact = resolve(kbRoot, inputPath);
  if (existsSync(exact)) return exact;

  const withExtension = resolve(kbRoot, inputPath + ".md");
  if (existsSync(withExtension)) return withExtension;

  return exact;
}

// --- output formatting ---

function printTree(entries: TreeEntry[]): void {
  for (const entry of entries) {
    const indent = "  ".repeat(entry.depth);
    const label = entry.type === "directory" ? `${entry.name}/` : entry.name;
    console.log(`${indent}${label}`);
  }
}

function printPaths(entries: TreeEntry[]): void {
  for (const entry of entries) {
    if (entry.type === "file") {
      console.log(entry.absolutePath);
    }
  }
}

// --- main ---

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help") {
  console.log("usage: mnemo list [path] [--paths]");
  process.exit(0);
}

if (command !== "list") {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}

const { root: kbRoot } = loadConfig();
const pathsFlag = args.includes("--paths");

// filter out flags to get the optional path argument
const positional = args.slice(1).filter((a) => !a.startsWith("--"));
const inputPath = positional[0];

// resolve what to list
const targetPath = inputPath ? resolvePath(kbRoot, inputPath) : kbRoot;

if (!existsSync(targetPath)) {
  console.error(`nothing found at: ${inputPath}`);
  process.exit(1);
}

const stat = statSync(targetPath);

if (stat.isFile()) {
  // single file — just output its absolute path
  if (pathsFlag) {
    console.log(targetPath);
  } else {
    // show the parent directory tree with this file marked
    const parentDir = dirname(targetPath);
    const entries = collectTree(parentDir, 0);
    const targetName = basename(targetPath);

    for (const entry of entries) {
      const indent = "  ".repeat(entry.depth);
      if (entry.type === "directory") {
        console.log(`${indent}${entry.name}/`);
      } else if (entry.name === targetName && entry.absolutePath === targetPath) {
        console.log(`${indent}→ ${entry.name}`);
      } else {
        console.log(`${indent}${entry.name}`);
      }
    }
  }
} else {
  // directory — show tree or paths
  const entries = collectTree(targetPath, 0);

  if (entries.length === 0) {
    console.error(`no notes found in: ${inputPath ?? "root"}`);
    process.exit(1);
  }

  if (pathsFlag) {
    printPaths(entries);
  } else {
    printTree(entries);
  }
}
