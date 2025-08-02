// Simple MCP server function for Netlify
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Parse request
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' })
      };
    }
  }

  const { method, params } = body;

  try {
    // Handle MCP protocol methods
    switch (method) {
      case 'initialize':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
              name: "javascript-package-manager",
              version: "1.0.0"
            }
          })
        };

      case 'tools/list':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            tools: [
              {
                name: "search_packages",
                description: "Search for packages in the npm registry",
                inputSchema: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "Search query" },
                    limit: { type: "number", description: "Max results", default: 25 }
                  },
                  required: ["query"]
                }
              },
              {
                name: "install_packages",
                description: "Install npm packages in a project",
                inputSchema: {
                  type: "object",
                  properties: {
                    packages: { type: "array", items: { type: "string" }, description: "Package names" },
                    dev: { type: "boolean", description: "Install as dev dependencies", default: false }
                  },
                  required: ["packages"]
                }
              }
            ]
          })
        };

      case 'tools/call':
        const { name, arguments: args } = params;
        let result;
        
        switch (name) {
          case "search_packages":
            result = {
              content: [{
                type: "text",
                text: `🔍 Search results for "${args.query}":\n\n📦 Example Package\n   Description: Mock search result\n   Latest: 1.0.0\n   Weekly downloads: 100,000`
              }]
            };
            break;
            
          case "install_packages":
            result = {
              content: [{
                type: "text",
                text: `✅ Successfully installed packages: ${args.packages.join(', ')}\n${args.dev ? '📁 Added to devDependencies' : '📦 Added to dependencies'}`
              }]
            };
            break;
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Unknown method: ${method}` })
        };
    }

  } catch (error) {
    console.error('MCP Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};