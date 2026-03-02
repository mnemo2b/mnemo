import { readFileSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parseFrontmatter } from "../frontmatter";

export function registerLoadTool(server: McpServer, kbRoot: string) {
  server.registerTool(
    "mnemo_load",
    {
      description:
        "Load a note from the knowledge base and return its full content. " +
        "Use this after mnemo_find to read a specific note.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        path: z.string().describe("file path within the knowledge base"),
      }),
    },
    async ({ path: filePath }) => {
      const absolutePath = resolve(kbRoot, filePath);

      // make sure the path stays inside the knowledge base
      if (!absolutePath.startsWith(kbRoot)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "path is outside the knowledge base",
            },
          ],
          isError: true,
        };
      }

      try {
        const raw = readFileSync(absolutePath, "utf-8");
        const { content } = parseFrontmatter(raw, filePath);

        return {
          content: [
            {
              type: "resource" as const,
              resource: {
                uri: `mnemo://${filePath}`,
                name: filePath,
                mimeType: "text/markdown",
                text: content,
              },
            },
          ],
        };
      } catch {
        return {
          content: [
            { type: "text" as const, text: `could not read: ${filePath}` },
          ],
          isError: true,
        };
      }
    },
  );
}
