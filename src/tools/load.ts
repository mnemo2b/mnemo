import { readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Bases } from "../core/config";
import { parseBasePath, resolveBasePath } from "../core/base";
import { parseFrontmatter } from "../core/frontmatter";
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

export function registerLoadTool(server: McpServer, bases: Bases) {
  server.registerTool(
    "mnemo_load",
    {
      description:
        "Load notes from the knowledge base and return their full content. " +
        "Paths are prefixed with the base name (e.g. 'personal/core/vision'). " +
        "Pass a file path to load one note, or a directory path to load all notes inside it recursively.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "base-prefixed file or directory path (e.g. 'personal/core/vision')",
          ),
      }),
    },
    async ({ path: inputPath }) => {
      const { baseName } = parseBasePath(inputPath);
      const baseRoot = bases[baseName];

      if (!baseRoot) {
        return {
          content: [
            { type: "text" as const, text: `unknown base: ${baseName}` },
          ],
          isError: true,
        };
      }

      let absolutePath: string;
      try {
        absolutePath = resolveBasePath(bases, inputPath);
      } catch {
        return {
          content: [
            { type: "text" as const, text: `could not resolve: ${inputPath}` },
          ],
          isError: true,
        };
      }

      // make sure the path stays inside the base
      if (!absolutePath.startsWith(baseRoot)) {
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
          const resource = loadFile(absolutePath, baseRoot, baseName);
          const prefixedPath = `${baseName}/${relative(baseRoot, absolutePath)}`;
          return {
            content: [
              { type: "text" as const, text: `Loaded: ${prefixedPath}` },
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

        const resources = files.map((f) => loadFile(f, baseRoot, baseName));
        const paths = files.map(
          (f) => `${baseName}/${relative(baseRoot, f)}`,
        );
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
