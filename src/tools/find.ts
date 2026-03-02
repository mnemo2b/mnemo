import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve, dirname, relative } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parseFrontmatter } from "../frontmatter";

export function registerFindTool(server: McpServer, kbRoot: string) {
  server.registerTool(
    "mnemo_find",
    {
      description:
        "Find notes in the knowledge base by browsing directory paths. " +
        "Pass a directory path to list its contents, a file path to see its siblings, " +
        "or no input to list the top-level directories.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        input: z
          .string()
          .optional()
          .describe("a path relative to the knowledge base root"),
      }),
    },
    async ({ input }) => {
      // decide which directory to list and whether a specific file was targeted
      const targetPath = input ? resolve(kbRoot, input) : kbRoot;
      let dirToList: string;
      let matchedFile: string | null = null;

      try {
        const stat = statSync(targetPath);
        if (stat.isDirectory()) {
          // input points to a directory — list its contents
          dirToList = targetPath;
        } else {
          // input points to a file — list the parent directory, mark this file
          dirToList = dirname(targetPath);
          matchedFile = targetPath;
        }
      } catch {
        // path doesn't exist — for now, return an error
        // (slice 3 will route this to search instead)
        return {
          content: [
            { type: "text" as const, text: `nothing found at: ${input}` },
          ],
        };
      }

      // read the directory contents
      const entries = readdirSync(dirToList, { withFileTypes: true })
        // skip hidden files and directories
        .filter((entry) => !entry.name.startsWith("."));

      // split into directories and files, sort each alphabetically
      const dirs = entries
        .filter((e) => e.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));

      const files = entries
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .sort((a, b) => a.name.localeCompare(b.name));

      // build the result list — directories first, then files
      const results = [
        ...dirs.map((d) => ({
          path: relative(kbRoot, join(dirToList, d.name)),
          type: "directory" as const,
          title: null as string | null,
          description: null as string | null,
          match: false,
        })),
        ...files.map((f) => {
          const fullPath = join(dirToList, f.name);
          const raw = readFileSync(fullPath, "utf-8");
          const { title, description } = parseFrontmatter(raw, f.name);
          return {
            path: relative(kbRoot, fullPath),
            type: "file" as const,
            title,
            description,
            match: matchedFile === fullPath,
          };
        }),
      ];

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    },
  );
}
