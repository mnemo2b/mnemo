import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, loadProjectConfig, mergeSets } from "./core/config";
import { registerListTool } from "./tools/list";
import { registerLoadTool } from "./tools/load";

const { bases, sets: globalSets } = loadConfig();
const { sets: projectSets } = loadProjectConfig(process.cwd());
const sets = mergeSets(globalSets, projectSets);

const server = new McpServer({
  name: "mnemo",
  version: "0.0.1",
});

registerListTool(server, bases);
registerLoadTool(server, bases, sets);

// connect via stdio and start listening
const transport = new StdioServerTransport();
await server.connect(transport);
