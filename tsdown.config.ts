import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/mcp.ts"],
  format: "esm",
  outDir: "dist",
  platform: "node",
  clean: true,
});
