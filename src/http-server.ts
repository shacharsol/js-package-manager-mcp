import { createServer as createHttpServer } from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer as createMCPServer } from "./server.js";
import { HTTP_SETTINGS, SERVER_NAME, VERSION, CORS_HEADERS } from "./constants.js";

export async function createHTTPMCPServer(port: number = HTTP_SETTINGS.DEFAULT_PORT): Promise<void> {
  const mcpServer = await createMCPServer();
  
  const httpServer = createHttpServer(async (req, res) => {
    // Enable CORS
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy',
        server: SERVER_NAME,
        version: VERSION,
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    if (req.url === '/tools') {
      // Return tools list for analysis tools like Smithery
      try {
        // Import the tools modules to get the tools list
        const searchTools = await import('./tools/search-tools.js');
        const installTools = await import('./tools/install-tools.js');
        const securityTools = await import('./tools/security-tools.js');
        const analysisTools = await import('./tools/analysis-tools.js');
        const managementTools = await import('./tools/management-tools.js');
        const { convertToolSchema } = await import('./utils/schema-converter.js');
        
        const allTools = [
          ...searchTools.tools,
          ...installTools.tools,
          ...securityTools.tools,
          ...analysisTools.tools,
          ...managementTools.tools
        ];
        
        const convertedTools = allTools.map(tool => convertToolSchema(tool));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tools: convertedTools }, null, 2));
        return;
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to load tools' }));
        return;
      }
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
              <li><code>/tools</code> - Tools list (JSON)</li>
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