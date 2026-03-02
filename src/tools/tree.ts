import { readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Recursively build an indented tree of directories and markdown files */
function buildTree(dir: string, kbRoot: string, depth: number): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."));

  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const indent = "  ".repeat(depth);
  const lines: string[] = [];

  // directories first, then files — matches mnemo_find ordering
  for (const d of dirs) {
    lines.push(`${indent}${d.name}/`);
    lines.push(...buildTree(join(dir, d.name), kbRoot, depth + 1));
  }

  for (const f of files) {
    lines.push(`${indent}${f.name}`);
  }

  return lines;
}

export function registerTreeTool(server: McpServer, kbRoot: string) {
  server.registerTool(
    "mnemo_tree",
    {
      description:
        "Show the full directory tree of the knowledge base. " +
        "Returns all directories and markdown files in a single call — " +
        "useful for orienting yourself before loading specific notes.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe("a directory path relative to the knowledge base root"),
      }),
    },
    async ({ path: inputPath }) => {
      const startDir = inputPath ? resolve(kbRoot, inputPath) : kbRoot;

      // make sure the path exists and is a directory
      try {
        const stat = statSync(startDir);
        if (!stat.isDirectory()) {
          return {
            content: [
              { type: "text" as const, text: `not a directory: ${inputPath}` },
            ],
          };
        }
      } catch {
        return {
          content: [
            { type: "text" as const, text: `nothing found at: ${inputPath}` },
          ],
        };
      }

      const lines = buildTree(startDir, kbRoot, 0);

      return {
        content: [
          { type: "text" as const, text: lines.join("\n") },
        ],
      };
    },
  );
}
