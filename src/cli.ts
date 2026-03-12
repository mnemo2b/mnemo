import { readFileSync, statSync, existsSync } from "fs";
import { join, resolve, dirname, basename } from "path";
import { homedir } from "os";
import { loadConfig, saveConfig, shortenPath } from "./core/config";
import { parseBasePath } from "./core/base";
import { parseFrontmatter } from "./core/frontmatter";
import { resolvePath } from "./core/resolve-path";
import { scanDirectory } from "./core/scan";

// ---------------------------------------------------------------------------
// tree structure

interface TreeNode {
  name: string;
  type: "directory" | "file";
  absolutePath: string;
  tokens: number;
  children: TreeNode[];
}

/** Recursively build a nested tree of directories and markdown files */
function buildTree(dir: string): TreeNode[] {
  const { dirs, files } = scanDirectory(dir);
  const nodes: TreeNode[] = [];

  for (const d of dirs) {
    const fullPath = join(dir, d.name);
    const children = buildTree(fullPath);
    const tokens = children.reduce((sum, child) => sum + child.tokens, 0);
    nodes.push({
      name: d.name,
      type: "directory",
      absolutePath: fullPath,
      tokens,
      children,
    });
  }

  for (const f of files) {
    const fullPath = join(dir, f.name);
    const raw = readFileSync(fullPath, "utf-8");
    const { content } = parseFrontmatter(raw, f.name);
    const tokens = Math.round(content.length / 4);
    nodes.push({
      name: f.name,
      type: "file",
      absolutePath: fullPath,
      tokens,
      children: [],
    });
  }

  return nodes;
}

// ----------------------------------------------------------------
// output formatting

/** Format a token count for display with tiered rounding */
function formatTokens(tokens: number): string {
  // 10k+ → nearest 1k: "12k", "36k"
  if (tokens >= 10000) {
    return `${Math.round(tokens / 1000)}k`;
  }
  // 1k–10k → one decimal: "2.4k", "6.4k"
  if (tokens >= 1000) {
    const k = tokens / 1000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return `${formatted}k`;
  }
  // under 1k → nearest 100: "100", "600"
  const rounded = Math.max(100, Math.round(tokens / 100) * 100);
  // edge case: 950–999 rounds to 1000
  if (rounded >= 1000) return "1k";
  return `${rounded}`;
}

// ansi codes — only used when stdout is a terminal
const isTTY = process.stdout.isTTY ?? false;
const DIM = isTTY ? "\x1b[2m" : "";
const RESET = isTTY ? "\x1b[0m" : "";

interface TreeLine {
  structure: string; // prefix + connector (always normal)
  name: string; // file or directory name
  tokens: string;
  isDirectory: boolean;
}

/** Render tree lines with box-drawing connectors and token counts */
function renderTree(
  nodes: TreeNode[],
  prefix: string,
  matchedPath: string | null,
): TreeLine[] {
  const lines: TreeLine[] = [];

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");

    // mark matched file with →
    const isMatch = matchedPath && node.absolutePath === matchedPath;
    const name = isMatch ? `→ ${node.name}` : node.name;
    const tokens = node.tokens > 0 ? formatTokens(node.tokens) : "";

    lines.push({
      structure: `${prefix}${connector}`,
      name,
      tokens,
      isDirectory: node.type === "directory",
    });

    if (node.children.length > 0) {
      lines.push(...renderTree(node.children, childPrefix, matchedPath));
    }
  });

  return lines;
}

/** Print lines with dimming for files and token counts, right-aligned */
function printLines(lines: TreeLine[]): void {
  // measure by the full plain-text width (no ansi) for alignment
  const maxWidth = lines.reduce(
    (max, line) => Math.max(max, line.structure.length + line.name.length),
    0,
  );

  for (const line of lines) {
    const plainWidth = line.structure.length + line.name.length;
    const padding = line.tokens ? " ".repeat(maxWidth - plainWidth + 3) : "";

    // structure (connectors) always normal brightness
    // directories: name + tokens normal
    // files: name + tokens dim
    if (line.isDirectory) {
      const tokenPart = line.tokens ? `${padding}${line.tokens}` : "";
      console.log(`${line.structure}${line.name}${tokenPart}`);
    } else {
      const tokenPart = line.tokens ? `${padding}${line.tokens}` : "";
      console.log(`${line.structure}${DIM}${line.name}${tokenPart}${RESET}`);
    }
  }
}

/** Count directories and files in a tree */
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

/** Collect all absolute file paths from a tree */
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

function printTree(
  rootLabel: string,
  nodes: TreeNode[],
  matchedPath: string | null,
): void {
  const lines = renderTree(nodes, "", matchedPath);

  console.log("");
  console.log(rootLabel);
  printLines(lines);

  // summary line with total tokens
  const { dirs, files } = countTree(nodes);
  const totalTokens = nodes.reduce((sum, node) => sum + node.tokens, 0);
  console.log("");
  console.log(
    `${dirs} directories, ${files} files ${DIM}(${formatTokens(totalTokens)} tokens)${RESET}`,
  );
}

// ----------------------------------------------------------------
// main

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help") {
  console.log("usage: mnemo <list|base> [options]");
  console.log("");
  console.log("commands:");
  console.log("  list [path] [--paths]       browse the knowledge base");
  console.log("  base add <name> <path>      register a knowledge base");
  console.log("  base remove <name>          unregister a knowledge base");
  console.log("  base list                   show registered bases");
  process.exit(0);
}

// ----------------------------------------------------------------
// mnemo base <add|remove|list>

if (command === "base") {
  const subcommand = args[1];

  if (subcommand === "list") {
    const { bases } = loadConfig();

    if (Object.keys(bases).length === 0) {
      console.log('no bases configured — run "mnemo base add <name> <path>"');
      process.exit(0);
    }

    const sorted = Object.entries(bases).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, path] of sorted) {
      console.log(`${name}: ${DIM}${shortenPath(path)}${RESET}`);
    }
    process.exit(0);
  }

  if (subcommand === "add") {
    const name = args[2];
    const rawPath = args[3];

    if (!name || !rawPath) {
      console.error("usage: mnemo base add <name> <path>");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      console.error("base name must be lowercase letters, numbers, and hyphens");
      process.exit(1);
    }

    // expand ~ and resolve to absolute path
    const expanded = rawPath.startsWith("~")
      ? rawPath.replace("~", homedir())
      : rawPath;
    const absolutePath = resolve(expanded);

    if (!existsSync(absolutePath) || !statSync(absolutePath).isDirectory()) {
      console.error(`not a directory: ${rawPath}`);
      process.exit(1);
    }

    const { bases } = loadConfig();

    if (bases[name]) {
      console.error(`base "${name}" already exists`);
      process.exit(1);
    }

    bases[name] = absolutePath;
    saveConfig(bases);
    console.log(`added base "${name}" → ${shortenPath(absolutePath)}`);
    process.exit(0);
  }

  if (subcommand === "remove") {
    const name = args[2];

    if (!name) {
      console.error("usage: mnemo base remove <name>");
      process.exit(1);
    }

    const { bases } = loadConfig();

    if (!bases[name]) {
      console.error(`unknown base: ${name}`);
      process.exit(1);
    }

    delete bases[name];
    saveConfig(bases);
    console.log(`removed base "${name}"`);
    process.exit(0);
  }

  console.error("usage: mnemo base <add|remove|list>");
  process.exit(1);
}

// ----------------------------------------------------------------
// mnemo list

if (command !== "list") {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}

const { bases } = loadConfig();
const pathsFlag = args.includes("--paths");

// filter out flags to get the optional path argument
const positional = args.slice(1).filter((a) => !a.startsWith("--"));
const inputPath = positional[0];

if (Object.keys(bases).length === 0) {
  console.error('no bases configured — run "mnemo base add <name> <path>"');
  process.exit(1);
}

if (!inputPath) {
  // no path — show all bases as top-level tree nodes
  const allNodes: TreeNode[] = [];
  for (const [name, root] of Object.entries(bases)) {
    const children = buildTree(root);
    const tokens = children.reduce((sum, child) => sum + child.tokens, 0);
    allNodes.push({
      name,
      type: "directory",
      absolutePath: root,
      tokens,
      children,
    });
  }

  if (pathsFlag) {
    const paths = collectPaths(allNodes);
    for (const p of paths) {
      console.log(p);
    }
  } else {
    printTree("mnemo", allNodes, null);
  }
} else {
  // parse base name from the first path segment
  const { baseName, relativePath } = parseBasePath(inputPath);
  const baseRoot = bases[baseName];

  if (!baseRoot) {
    console.error(`Unknown base: "${baseName}"\n`);
    console.error("Bases:");
    for (const [name, path] of Object.entries(bases)) {
      console.error(`  ${name}: ${DIM}${shortenPath(path)}${RESET}`);
    }
    process.exit(1);
  }

  const targetPath = relativePath
    ? resolvePath(baseRoot, relativePath)
    : baseRoot;

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
      console.error(`no notes found in: ${inputPath}`);
      process.exit(1);
    }

    if (pathsFlag) {
      const paths = collectPaths(nodes);
      for (const p of paths) {
        console.log(p);
      }
    } else {
      printTree(inputPath, nodes, null);
    }
  }
}
