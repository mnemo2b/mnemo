import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config";
import { registerFindTool } from "./tools/find";
import { registerLoadTool } from "./tools/load";
import { registerTreeTool } from "./tools/tree";

// read the kb root path
const config = loadConfig();

// create an mcp server instance
const server = new McpServer({
  name: "mnemo",
  version: "0.0.1",
});

// register tools
registerFindTool(server, config.root);
registerLoadTool(server, config.root);
registerTreeTool(server, config.root);

// connect via stdio and start listening
const transport = new StdioServerTransport();
await server.connect(transport);
