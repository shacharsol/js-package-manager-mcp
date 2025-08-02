#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  try {
    // Create the MCP server instance
    const server = await createServer();
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
    
    console.error("JavaScript Package Manager MCP server started");
    
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.error("Shutting down server...");
      await server.close();
      process.exit(0);
    });
    
    process.on("SIGTERM", async () => {
      console.error("Shutting down server...");
      await server.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();