import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { analytics } from "./analytics.js";
import { SERVER_NAME, VERSION } from "./constants.js";
import { convertToolSchema } from "./utils/schema-converter.js";

// Import tool modules that export their tool definitions and handlers
import * as searchTools from "./tools/search-tools.js";
import * as installTools from "./tools/install-tools.js";
import * as securityTools from "./tools/security-tools.js";
import * as analysisTools from "./tools/analysis-tools.js";
import * as managementTools from "./tools/management-tools.js";

export async function createServer(): Promise<Server> {
  // Debug logging to stderr instead of stdout
  console.error(`[npmplus-mcp] Server starting with version ${VERSION} at ${new Date().toISOString()}`);
  console.error(`[npmplus-mcp] Current working directory: ${process.cwd()}`);
  console.error(`[npmplus-mcp] Node version: ${process.version}`);
  console.error(`[npmplus-mcp] Platform: ${process.platform}`);
  
  const server = new Server(
    {
      name: SERVER_NAME,
      version: VERSION
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
      
      // Debug logging to stderr
      console.error(`[npmplus-mcp] ListToolsRequest received at ${new Date().toISOString()}`);
      console.error(`[npmplus-mcp] Returning ${allTools.length} tools`);
      
      return {
        tools: allTools.map(tool => convertToolSchema(tool))
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
      
      // Debug logging to stderr
      console.error(`\n[npmplus-mcp v${VERSION}] ========== Tool Call ==========`);
      console.error(`[npmplus-mcp] Tool: ${name}`);
      console.error(`[npmplus-mcp] Time: ${new Date().toISOString()}`);
      console.error(`[npmplus-mcp] Raw args:`, JSON.stringify(args, null, 2));
      
      const handler = toolHandlers.get(name);
      if (!handler) {
        console.error(`[npmplus-mcp] ERROR: Unknown tool: ${name}`);
        throw new Error(`Unknown tool: ${name}`);
      }

      const startTime = Date.now();
      try {
        // MCP Workaround: Fix cwd parameter that gets transformed from "." to "/"
        let fixedArgs = args;
        if (args && typeof args === 'object' && 'cwd' in args) {
          // Debug logging to stderr
          console.error(`[npmplus-mcp] CWD Detection:`);
          console.error(`[npmplus-mcp]   - Found cwd parameter: "${args.cwd}"`);
          console.error(`[npmplus-mcp]   - Current process.cwd(): "${process.cwd()}"`);
          console.error(`[npmplus-mcp]   - Type of cwd: ${typeof args.cwd}`);
          
          // UPDATED FIX: Always convert '/' to '.' since users never mean root
          if (args.cwd === '/') {
            console.error(`[npmplus-mcp] ✅ APPLYING FIX: Converting "/" to "."`);
            fixedArgs = { ...args, cwd: '.' };
            console.error(`[npmplus-mcp] Fixed args:`, JSON.stringify(fixedArgs, null, 2));
          } else if (args.cwd === '') {
            // Empty string should also be treated as current directory
            console.error(`[npmplus-mcp] ✅ APPLYING FIX: Converting empty string to "."`);
            fixedArgs = { ...args, cwd: '.' };
            console.error(`[npmplus-mcp] Fixed args:`, JSON.stringify(fixedArgs, null, 2));
          } else {
            console.error(`[npmplus-mcp] ℹ️  No fix needed for cwd: "${args.cwd}"`);
          }
        } else {
          console.error(`[npmplus-mcp] ℹ️  No cwd parameter found in args`);
        }
        
        console.error(`[npmplus-mcp] Calling handler for ${name}...`);
        const result = await handler(fixedArgs);
        const responseTime = Date.now() - startTime;
        
        // Log successful completion to stderr
        console.error(`[npmplus-mcp] ✅ Tool ${name} completed successfully in ${responseTime}ms`);
        console.error(`[npmplus-mcp] ==============================\n`);
        
        // Track successful tool usage
        analytics.trackToolUsage(name, true, responseTime);
        
        return result;
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        
        // Log error details to stderr
        console.error(`[npmplus-mcp] ❌ Tool ${name} failed after ${responseTime}ms`);
        console.error(`[npmplus-mcp] Error:`, error.message);
        console.error(`[npmplus-mcp] Stack:`, error.stack);
        console.error(`[npmplus-mcp] ==============================\n`);
        
        // Track failed tool usage
        analytics.trackToolUsage(name, false, responseTime, undefined, undefined, error);
        
        if (error.name === "ZodError") {
          throw new Error(`Invalid arguments: ${error.message}`);
        }
        throw error;
      }
    }
  );

  console.error(`[npmplus-mcp] Server initialization complete`);
  return server;
}