import { loadConfig, loadProjectConfig, mergeSets, shortenPath } from "../core/config";
import { resolveSet } from "../core/set";
import { buildTree, type TreeNode } from "./list";

// ---------------------------------------------------------------------------
// plain-text tree renderer for agent context (no box-drawing, no tokens)

function renderPlainTree(nodes: TreeNode[], prefix: string): string[] {
  const lines: string[] = [];

  for (const node of nodes) {
    const suffix = node.type === "directory" ? "/" : "";
    lines.push(`${prefix}${node.name}${suffix}`);
    if (node.children.length > 0) {
      lines.push(...renderPlainTree(node.children, prefix + "  "));
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------

export function runPrime(): void {
  const { bases, sets: globalSets } = loadConfig();
  const { sets: projectSets } = loadProjectConfig(process.cwd());
  const allSets = mergeSets(globalSets, projectSets);

  const hasBases = Object.keys(bases).length > 0;
  const hasSets = Object.keys(allSets).length > 0;

  if (!hasBases) return;

  // directive
  console.log(
    "[mnemo] The user's knowledge base. " +
    "All notes, knowledge, and markdown references live here. " +
    "Interact through the mnemo skill: list, load, save. " +
    "Writes (save, capture, append) run via the skill's save sub-agent. " +
    "Do not Write or Edit KB files directly. " +
    "If a path fails, use `mnemo list --depth 2` to reorient.",
  );
  console.log("");

  // commands — how to use mnemo (agent needs this before the skill is invoked)
  console.log("commands:");
  console.log("  mnemo list — show structure");
  console.log("  mnemo list <base/path> — show a specific directory (e.g. eval/cooking)");
  console.log("  mnemo list --depth N — cap tree depth for large bases");
  console.log("  mnemo load <base/path> — read contents");
  console.log("  mnemo load :<set-name> — load a named set");
  console.log("  paths always start with a base name: eval/cooking, not cooking");
  console.log("  .md extension is optional: eval/cooking/pasta-carbonara works");
  console.log("");

  // bases
  console.log("bases:");
  for (const [name, path] of Object.entries(bases).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${name}: ${shortenPath(path)}`);
  }

  // sets
  if (hasSets) {
    console.log("");
    console.log("sets bundle related paths under a name so you can load them together:");
    const names = Object.keys(allSets).sort();
    for (const name of names) {
      const source = name in projectSets ? "project" : "global";
      try {
        const paths = resolveSet(name, allSets);
        console.log(`  ${name} [${source}]: ${paths.join(", ")}`);
      } catch {
        console.log(`  ${name} [${source}]: (unresolved)`);
      }
    }
  }

  // tree — depth 2, no tokens
  console.log("");
  console.log("structure:");
  for (const [name, root] of Object.entries(bases).sort(([a], [b]) => a.localeCompare(b))) {
    const nodes = buildTree(root, { maxDepth: 2, skipTokens: true });
    console.log(`  ${name}/`);
    const lines = renderPlainTree(nodes, "    ");
    for (const line of lines) {
      console.log(line);
    }
  }
}
