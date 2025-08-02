import { createServer as createHttpServer } from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer as createMCPServer } from "./server.js";

export async function createHTTPMCPServer(port: number = 3000): Promise<void> {
  const mcpServer = await createMCPServer();
  
  const httpServer = createHttpServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy',
        server: 'javascript-package-manager',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    if (req.url === '/mcp') {
      // Handle MCP over SSE
      const transport = new SSEServerTransport("/mcp", res);
      await mcpServer.connect(transport);
      return;
    }
    
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>JavaScript Package Manager MCP Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { color: green; font-weight: bold; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
            pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>JavaScript Package Manager MCP Server</h1>
            <p class="status">✅ Server is running</p>
            
            <h2>Endpoints</h2>
            <ul>
              <li><code>/health</code> - Health check</li>
              <li><code>/mcp</code> - MCP Server-Sent Events endpoint</li>
            </ul>
            
            <h2>Configuration</h2>
            <p>Use this server in your MCP client:</p>
            <pre>{
  "mcpServers": {
    "javascript-package-manager": {
      "command": "node",
      "args": ["-e", "require('http').get('${req.headers.host}/mcp')"],
      "env": {}
    }
  }
}</pre>
            
            <h2>Available Tools</h2>
            <ul>
              <li>search_packages - Search npm registry</li>
              <li>install_packages - Install packages</li>
              <li>audit_dependencies - Security scanning</li>
              <li>check_bundle_size - Bundle analysis</li>
              <li>dependency_tree - Dependency visualization</li>
              <li>And many more...</li>
            </ul>
          </div>
        </body>
        </html>
      `);
      return;
    }
    
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
  
  httpServer.listen(port, () => {
    console.log(`🚀 JavaScript Package Manager MCP Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔌 MCP endpoint: http://localhost:${port}/mcp`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    httpServer.close(() => {
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    httpServer.close(() => {
      process.exit(0);
    });
  });
}