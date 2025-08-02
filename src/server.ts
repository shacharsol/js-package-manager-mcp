import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { analytics } from "./analytics.js";

// Import tool modules that export their tool definitions and handlers
import * as searchTools from "./tools/search-tools.js";
import * as installTools from "./tools/install-tools.js";
import * as securityTools from "./tools/security-tools.js";
import * as analysisTools from "./tools/analysis-tools.js";
import * as managementTools from "./tools/management-tools.js";

export async function createServer(): Promise<Server> {
  const server = new Server(
    {
      name: "javascript-package-manager",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Aggregate all tools
  const allTools = [
    ...searchTools.tools,
    ...installTools.tools,
    ...securityTools.tools,
    ...analysisTools.tools,
    ...managementTools.tools
  ];

  // Create a map of tool handlers
  const toolHandlers = new Map<string, (args: any) => Promise<any>>([
    ...searchTools.handlers,
    ...installTools.handlers,
    ...securityTools.handlers,
    ...analysisTools.handlers,
    ...managementTools.handlers
  ]);

  // Register unified tools/list handler
  server.setRequestHandler(
    ListToolsRequestSchema,
    async (request) => {
      const parsed = ListToolsRequestSchema.safeParse(request);
      if (!parsed.success) {
        throw new Error(`Invalid request: ${parsed.error}`);
      }
      
      return {
        tools: allTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    }
  );

  // Register unified tools/call handler
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const parsed = CallToolRequestSchema.safeParse(request);
      if (!parsed.success) {
        throw new Error(`Invalid request: ${parsed.error}`);
      }

      const { name, arguments: args } = parsed.data.params;
      
      const handler = toolHandlers.get(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      const startTime = Date.now();
      try {
        const result = await handler(args);
        const responseTime = Date.now() - startTime;
        
        // Track successful tool usage
        analytics.trackToolUsage(name, true, responseTime);
        
        return result;
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        
        // Track failed tool usage
        analytics.trackToolUsage(name, false, responseTime, undefined, undefined, error);
        
        if (error.name === "ZodError") {
          throw new Error(`Invalid arguments: ${error.message}`);
        }
        throw error;
      }
    }
  );

  return server;
}