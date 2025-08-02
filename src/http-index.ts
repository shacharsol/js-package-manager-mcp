#!/usr/bin/env node

import { createHTTPMCPServer } from "./http-server.js";

async function main() {
  const port = parseInt(process.env.PORT || "3000");
  
  try {
    await createHTTPMCPServer(port);
  } catch (error) {
    console.error("Failed to start HTTP MCP server:", error);
    process.exit(1);
  }
}

main();