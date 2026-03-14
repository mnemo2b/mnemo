import { readFileSync, statSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { loadConfig, shortenPath } from "../core/config";
import { CLIError } from "../core/errors";
import { parseBasePath } from "../core/base";
import { parseFrontmatter } from "../core/frontmatter";
import { resolvePath } from "../core/resolve-path";
import { scanDirectory } from "../core/scan";
import { DIM, RESET, formatTokens } from "./format";

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

// ---------------------------------------------------------------------------
// output formatting

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

// ---------------------------------------------------------------------------
// command handler

export function runList(args: string[]): void {
  const { bases } = loadConfig();
  const inputPath = args[0];

  if (Object.keys(bases).length === 0) {
    throw new CLIError('no bases configured — run "mnemo base add <name> <path>"');
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

    printTree("mnemo", allNodes, null);
    return;
  }

  // parse base name from the first path segment
  const { baseName, relativePath } = parseBasePath(inputPath);
  const baseRoot = bases[baseName];

  if (!baseRoot) {
    const baseList = Object.entries(bases)
      .map(([name, path]) => `  ${name}: ${shortenPath(path)}`)
      .join("\n");
    throw new CLIError(`unknown base: "${baseName}"\n\nbases:\n${baseList}`);
  }

  const targetPath = relativePath
    ? resolvePath(baseRoot, relativePath)
    : baseRoot;

  if (!existsSync(targetPath)) {
    throw new CLIError(`nothing found at: ${inputPath}`);
  }

  const stat = statSync(targetPath);

  if (stat.isFile()) {
    // show the parent directory tree with this file marked
    const parentDir = dirname(targetPath);
    const parentName = basename(parentDir);
    const nodes = buildTree(parentDir);
    printTree(parentName, nodes, targetPath);
  } else {
    const nodes = buildTree(targetPath);

    if (nodes.length === 0) {
      throw new CLIError(`no notes found in: ${inputPath}`);
    }

    printTree(inputPath, nodes, null);
  }
}
