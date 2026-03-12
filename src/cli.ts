import { readdirSync, statSync, existsSync } from "fs";
import { join, resolve, dirname, basename } from "path";
import { loadConfig } from "./config";

// --- tree structure ---

interface TreeNode {
  name: string;
  type: "directory" | "file";
  absolutePath: string;
  children: TreeNode[];
}

/** recursively build a nested tree of directories and markdown files */
function buildTree(dir: string): TreeNode[] {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."));

  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const nodes: TreeNode[] = [];

  for (const d of dirs) {
    const fullPath = join(dir, d.name);
    nodes.push({
      name: d.name,
      type: "directory",
      absolutePath: fullPath,
      children: buildTree(fullPath),
    });
  }

  for (const f of files) {
    nodes.push({
      name: f.name,
      type: "file",
      absolutePath: join(dir, f.name),
      children: [],
    });
  }

  return nodes;
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

/** render tree lines with box-drawing connectors */
function renderTree(
  nodes: TreeNode[],
  prefix: string,
  matchedPath: string | null,
): string[] {
  const lines: string[] = [];

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    // mark matched file with →
    const isMatch = matchedPath && node.absolutePath === matchedPath;
    const label = isMatch ? `→ ${node.name}` : node.name;

    lines.push(`${prefix}${connector}${label}`);

    if (node.children.length > 0) {
      lines.push(...renderTree(node.children, childPrefix, matchedPath));
    }
  });

  return lines;
}

/** count directories and files in a tree */
function countTree(nodes: TreeNode[]): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;

  for (const node of nodes) {
    if (node.type === "directory") {
      dirs++;
      const sub = countTree(node.children);
      dirs += sub.dirs;
      files += sub.files;
    } else {
      files++;
    }
  }

  return { dirs, files };
}

/** collect all absolute file paths from a tree */
function collectPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];

  for (const node of nodes) {
    if (node.type === "file") {
      paths.push(node.absolutePath);
    }
    if (node.children.length > 0) {
      paths.push(...collectPaths(node.children));
    }
  }

  return paths;
}

function printTree(rootLabel: string, nodes: TreeNode[], matchedPath: string | null): void {
  console.log(rootLabel);
  const lines = renderTree(nodes, "", matchedPath);
  for (const line of lines) {
    console.log(line);
  }

  // summary line
  const { dirs, files } = countTree(nodes);
  console.log("");
  console.log(`${dirs} directories, ${files} files`);
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
  if (pathsFlag) {
    console.log(targetPath);
  } else {
    // show the parent directory tree with this file marked
    const parentDir = dirname(targetPath);
    const parentName = basename(parentDir);
    const nodes = buildTree(parentDir);
    printTree(parentName, nodes, targetPath);
  }
} else {
  const nodes = buildTree(targetPath);

  if (nodes.length === 0) {
    console.error(`no notes found in: ${inputPath ?? "root"}`);
    process.exit(1);
  }

  if (pathsFlag) {
    const paths = collectPaths(nodes);
    for (const p of paths) {
      console.log(p);
    }
  } else {
    const label = inputPath ?? basename(kbRoot);
    printTree(label, nodes, null);
  }
}
