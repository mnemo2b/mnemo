import { statSync } from "fs";
import { join, resolve, dirname, relative } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { scanDirectory } from "../core/scan";

interface ListEntry {
  path: string;
  type: "directory" | "file";
  depth: number;
  match: boolean;
}

/** Recursively collect all directories and markdown files from a starting directory */
function collectEntries(
  dir: string,
  kbRoot: string,
  depth: number,
  matchedFile: string | null,
): ListEntry[] {
  const { dirs, files } = scanDirectory(dir);
  const results: ListEntry[] = [];

  // directories first — add the directory, then recurse into it
  for (const d of dirs) {
    const fullPath = join(dir, d.name);
    results.push({
      path: relative(kbRoot, fullPath),
      type: "directory",
      depth,
      match: false,
    });
    results.push(...collectEntries(fullPath, kbRoot, depth + 1, matchedFile));
  }

  // then files
  for (const f of files) {
    const fullPath = join(dir, f.name);
    results.push({
      path: relative(kbRoot, fullPath),
      type: "file",
      depth,
      match: matchedFile === fullPath,
    });
  }

  return results;
}

export function registerListTool(server: McpServer, kbRoot: string) {
  server.registerTool(
    "mnemo_list",
    {
      description:
        "Browse the knowledge base by listing directory contents recursively. " +
        "Pass a directory path to see everything inside it, a file path to see its siblings, " +
        "or no path to list the full knowledge base tree.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe("a path relative to the knowledge base root"),
      }),
    },
    async ({ path: inputPath }) => {
      // decide which directory to list and whether a specific file was targeted
      const targetPath = inputPath ? resolve(kbRoot, inputPath) : kbRoot;
      let dirToList: string;
      let matchedFile: string | null = null;

      try {
        const stat = statSync(targetPath);
        if (stat.isDirectory()) {
          dirToList = targetPath;
        } else {
          // file path — list the parent directory, mark this file
          dirToList = dirname(targetPath);
          matchedFile = targetPath;
        }
      } catch {
        return {
          content: [
            { type: "text" as const, text: `nothing found at: ${inputPath}` },
          ],
        };
      }

      const results = collectEntries(dirToList, kbRoot, 0, matchedFile);

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    },
  );
}
