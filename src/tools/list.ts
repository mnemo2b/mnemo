import { statSync } from "fs";
import { join, relative, dirname } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Bases } from "../core/config";
import { parseBasePath } from "../core/base";
import { resolvePath } from "../core/resolve-path";
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
  rootPath: string,
  pathPrefix: string,
  depth: number,
  matchedFile: string | null,
): ListEntry[] {
  const { dirs, files } = scanDirectory(dir);
  const results: ListEntry[] = [];

  // directories first — add the directory, then recurse into it
  for (const d of dirs) {
    const fullPath = join(dir, d.name);
    results.push({
      path: `${pathPrefix}${relative(rootPath, fullPath)}`,
      type: "directory",
      depth,
      match: false,
    });
    results.push(
      ...collectEntries(fullPath, rootPath, pathPrefix, depth + 1, matchedFile),
    );
  }

  // then files
  for (const f of files) {
    const fullPath = join(dir, f.name);
    results.push({
      path: `${pathPrefix}${relative(rootPath, fullPath)}`,
      type: "file",
      depth,
      match: matchedFile === fullPath,
    });
  }

  return results;
}

export function registerListTool(server: McpServer, bases: Bases) {
  server.registerTool(
    "mnemo_list",
    {
      description:
        "Browse the knowledge base by listing directory contents recursively. " +
        "Paths are prefixed with the base name (e.g. 'personal/core'). " +
        "Pass no path to see all bases, a base name to browse it, " +
        "or a base-prefixed path to list a subdirectory.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe(
            "base-prefixed path (e.g. 'personal', 'personal/core')",
          ),
      }),
    },
    async ({ path: inputPath }) => {
      // no path — list all bases as top-level entries
      if (!inputPath) {
        const results: ListEntry[] = [];
        for (const [name, root] of Object.entries(bases)) {
          results.push({
            path: name,
            type: "directory",
            depth: 0,
            match: false,
          });
          results.push(
            ...collectEntries(root, root, `${name}/`, 1, null),
          );
        }
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(results, null, 2) },
          ],
        };
      }

      // parse base name from the path
      const { baseName, relativePath } = parseBasePath(inputPath);
      const baseRoot = bases[baseName];

      if (!baseRoot) {
        return {
          content: [
            { type: "text" as const, text: `unknown base: ${baseName}` },
          ],
          isError: true,
        };
      }

      const targetPath = relativePath
        ? resolvePath(baseRoot, relativePath)
        : baseRoot;
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

      const results = collectEntries(
        dirToList,
        baseRoot,
        `${baseName}/`,
        0,
        matchedFile,
      );

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    },
  );
}
