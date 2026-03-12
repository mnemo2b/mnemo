import { readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parseFrontmatter } from "../core/frontmatter";
import { resolvePath } from "../core/resolve-path";
import { scanDirectory } from "../core/scan";

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
function loadFile(absolutePath: string, kbRoot: string) {
  const filePath = relative(kbRoot, absolutePath);
  const raw = readFileSync(absolutePath, "utf-8");
  const { content } = parseFrontmatter(raw, filePath);

  return {
    type: "resource" as const,
    resource: {
      uri: `mnemo://${filePath}`,
      name: filePath,
      mimeType: "text/markdown",
      text: content,
    },
  };
}

export function registerLoadTool(server: McpServer, kbRoot: string) {
  server.registerTool(
    "mnemo_load",
    {
      description:
        "Load notes from the knowledge base and return their full content. " +
        "Pass a file path to load one note, or a directory path to load all notes inside it recursively.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z.string().describe("file or directory path within the knowledge base"),
      }),
    },
    async ({ path: inputPath }) => {
      const absolutePath = resolvePath(kbRoot, inputPath);

      // make sure the path stays inside the knowledge base
      if (!absolutePath.startsWith(kbRoot)) {
        return {
          content: [
            { type: "text" as const, text: "path is outside the knowledge base" },
          ],
          isError: true,
        };
      }

      try {
        const stat = statSync(absolutePath);

        if (stat.isFile()) {
          const resource = loadFile(absolutePath, kbRoot);
          const filePath = relative(kbRoot, absolutePath);
          return {
            content: [
              { type: "text" as const, text: `Loaded: ${filePath}` },
              resource,
            ],
          };
        }

        // directory — load all markdown files recursively
        const files = collectFiles(absolutePath);

        if (files.length === 0) {
          return {
            content: [
              { type: "text" as const, text: `no notes found in: ${inputPath}` },
            ],
          };
        }

        const resources = files.map((f) => loadFile(f, kbRoot));
        const paths = files.map((f) => relative(kbRoot, f));
        const summary = `Loaded ${files.length} notes:\n${paths.map((p) => `- ${p}`).join("\n")}`;

        return {
          content: [
            { type: "text" as const, text: summary },
            ...resources,
          ],
        };
      } catch {
        return {
          content: [
            { type: "text" as const, text: `could not read: ${inputPath}` },
          ],
          isError: true,
        };
      }
    },
  );
}
