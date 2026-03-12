import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/mcp.ts", "src/cli.ts"],
  format: "esm",
  outDir: "dist",
  platform: "node",
  clean: true,
  banner: {
    // shebang only applies to cli bundle — tsdown prepends to all entries
    // but it's harmless in mcp.mjs (treated as a comment by node)
    js: "#!/usr/bin/env node",
  },
});
