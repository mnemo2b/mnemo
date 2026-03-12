import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./core/config";
import { registerListTool } from "./tools/list";
import { registerLoadTool } from "./tools/load";

const { bases } = loadConfig();

const server = new McpServer({
  name: "mnemo",
  version: "0.0.1",
});

registerListTool(server, bases);
registerLoadTool(server, bases);

// connect via stdio and start listening
const transport = new StdioServerTransport();
await server.connect(transport);
