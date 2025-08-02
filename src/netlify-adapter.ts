import { createServer } from "./server.js";
import { Handler } from '@netlify/functions';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_REQUESTS || '1000');
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  const data = rateLimitStore.get(ip);
  
  if (now > data.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (data.count >= RATE_LIMIT) {
    return false;
  }
  
  data.count++;
  return true;
}

export const handler: Handler = async (event, context) => {
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

  // Rate limiting
  const clientIP = event.headers['x-forwarded-for'] || 
                   event.headers['x-real-ip'] || 
                   context.clientContext?.ip || 
                   'unknown';
  
  if (!checkRateLimit(clientIP)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ 
        error: 'Rate limit exceeded',
        limit: RATE_LIMIT,
        window: '1 hour'
      })
    };
  }

  try {
    // Create MCP server instance
    const mcpServer = await createServer();
    
    // Parse request body
    const requestBody = event.body ? JSON.parse(event.body) : {};
    
    // Handle MCP protocol methods
    const { method, params } = requestBody;
    
    switch (method) {
      case 'initialize':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "javascript-package-manager",
              version: "1.0.0"
            }
          })
        };
        
      case 'tools/list':
        // Mock tools list response (replace with actual MCP server tools)
        const tools = [
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
                packages: { 
                  type: "array",
                  items: { type: "string" },
                  description: "Package names to install"
                },
                dev: { type: "boolean", description: "Install as dev dependencies", default: false }
              },
              required: ["packages"]
            }
          }
        ];
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ tools })
        };
        
      case 'tools/call':
        const { name, arguments: args } = params;
        
        // Mock tool responses (replace with actual tool implementations)
        let result;
        switch (name) {
          case "search_packages":
            result = {
              content: [
                {
                  type: "text",
                  text: `🔍 Search results for "${args.query}":\n\n📦 Example Package\n   Description: Mock search result\n   Latest: 1.0.0\n   Weekly downloads: 100,000`
                }
              ]
            };
            break;
            
          case "install_packages":
            result = {
              content: [
                {
                  type: "text",
                  text: `✅ Successfully installed packages: ${args.packages.join(', ')}\n${args.dev ? '📁 Added to devDependencies' : '📦 Added to dependencies'}`
                }
              ]
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
    console.error('MCP Netlify Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};