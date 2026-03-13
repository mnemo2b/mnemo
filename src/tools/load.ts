import { readFileSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Bases } from "../core/config";
import type { Sets } from "../core/sets";
import { parseBasePath, resolveBasePath } from "../core/base";
import { parseFrontmatter } from "../core/frontmatter";
import { scanDirectory } from "../core/scan";
import { parseLoadItems } from "../core/parse-items";
import { resolveSet } from "../core/sets";

/** Recursively collect all markdown file paths in a directory */
function collectFiles(dir: string): string[] {
  const { dirs, files } = scanDirectory(dir);
  const results: string[] = [];

  for (const d of dirs) {
    results.push(...collectFiles(join(dir, d.name)));
  }

  for (const f of files) {
    results.push(join(dir, f.name));
  }

  return results;
}

/** Load a single file and return it as an MCP resource */
function loadFile(absolutePath: string, baseRoot: string, baseName: string) {
  const relativePart = relative(baseRoot, absolutePath);
  const prefixedPath = `${baseName}/${relativePart}`;
  const raw = readFileSync(absolutePath, "utf-8");
  const { content } = parseFrontmatter(raw, prefixedPath);

  return {
    type: "resource" as const,
    resource: {
      uri: `mnemo://${prefixedPath}`,
      name: prefixedPath,
      mimeType: "text/markdown",
      text: content,
    },
  };
}

/** Resolve a base-prefixed path to absolute files, returning resources */
function resolveToResources(
  bases: Bases,
  path: string,
): { resources: ReturnType<typeof loadFile>[]; warnings: string[] } {
  const { baseName } = parseBasePath(path);
  const baseRoot = bases[baseName];
  const warnings: string[] = [];

  if (!baseRoot) {
    return { resources: [], warnings: [`unknown base: ${baseName}`] };
  }

  let absolutePath: string;
  try {
    absolutePath = resolveBasePath(bases, path);
  } catch {
    return { resources: [], warnings: [`could not resolve: ${path}`] };
  }

  if (!absolutePath.startsWith(baseRoot)) {
    return { resources: [], warnings: [`path is outside the knowledge base: ${path}`] };
  }

  if (!existsSync(absolutePath)) {
    return { resources: [], warnings: [`not found: ${path}`] };
  }

  try {
    const stat = statSync(absolutePath);

    if (stat.isFile()) {
      return { resources: [loadFile(absolutePath, baseRoot, baseName)], warnings: [] };
    }

    // directory — load all files recursively
    const files = collectFiles(absolutePath);
    if (files.length === 0) {
      return { resources: [], warnings: [`no notes found in: ${path}`] };
    }

    return {
      resources: files.map((f) => loadFile(f, baseRoot, baseName)),
      warnings: [],
    };
  } catch {
    return { resources: [], warnings: [`could not read: ${path}`] };
  }
}

export function registerLoadTool(server: McpServer, bases: Bases, sets: Sets) {
  server.registerTool(
    "mnemo_load",
    {
      description:
        "Load notes from the knowledge base and return their full content. " +
        "Accepts base-prefixed paths, :set-name references, or comma-separated mixed input. " +
        "Examples: 'personal/core/vision', ':react', ':react, personal/core'.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "base-prefixed path, :set-name, or comma-separated mixed input",
          ),
      }),
    },
    async ({ path: input }) => {
      const items = parseLoadItems(input);
      const allWarnings: string[] = [];
      const seen = new Set<string>();
      const allResources: ReturnType<typeof loadFile>[] = [];

      // collect base-prefixed paths from all items
      const basePaths: string[] = [];
      for (const item of items) {
        if (item.type === "set") {
          try {
            const paths = resolveSet(item.name, sets);
            basePaths.push(...paths);
          } catch (e) {
            allWarnings.push((e as Error).message);
          }
        } else {
          basePaths.push(item.path);
        }
      }

      // resolve each path to resources, deduplicating by URI
      for (const path of basePaths) {
        const { resources, warnings } = resolveToResources(bases, path);
        allWarnings.push(...warnings);
        for (const r of resources) {
          if (!seen.has(r.resource.uri)) {
            seen.add(r.resource.uri);
            allResources.push(r);
          }
        }
      }

      if (allResources.length === 0) {
        const message = allWarnings.length > 0
          ? allWarnings.join("\n")
          : `nothing found for: ${input}`;
        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }

      // build summary
      const names = allResources.map((r) => r.resource.name);
      const summary = allResources.length === 1
        ? `Loaded: ${names[0]}`
        : `Loaded ${allResources.length} notes:\n${names.map((n) => `- ${n}`).join("\n")}`;

      const warningText = allWarnings.length > 0
        ? `\n\nWarnings:\n${allWarnings.map((w) => `- ${w}`).join("\n")}`
        : "";

      return {
        content: [
          { type: "text" as const, text: summary + warningText },
          ...allResources,
        ],
      };
    },
  );
}
