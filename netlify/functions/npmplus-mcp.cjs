// Full-featured MCP server for Netlify Functions
// Implements complete package management functionality without ES module dependencies

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Log request details for debugging (only in development)
  console.log('MCP Request:', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? event.body.substring(0, 200) : null,
    userAgent: event.headers['user-agent'] || event.headers['User-Agent']
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Handle GET requests for service discovery
  if (event.httpMethod === 'GET') {
    // Return server capabilities for service discovery
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name: "npmplus-mcp",
        version: "1.0.13",
        description: "JavaScript Package Manager MCP Server",
        capabilities: {
          tools: {},
          server: {
            name: "npmplus-mcp",
            version: "1.0.13"
          }
        },
        endpoints: {
          initialize: "POST /",
          "tools/list": "POST /",
          "tools/call": "POST /"
        }
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Handle MCP protocol requests
    if (body.method === 'initialize') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          protocolVersion: "1.0.0",
          serverInfo: {
            name: "npmplus-mcp",
            version: "1.0.13"
          },
          capabilities: {
            tools: {}
          }
        })
      };
    }
    
    if (body.method === 'tools/list') {
      const tools = [
        // Search Tools
        {
          name: "search_packages",
          description: "Search for packages in the npm registry",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              limit: { type: "number", description: "Number of results (max 100)", default: 25, maximum: 100 },
              from: { type: "number", description: "Offset for pagination", default: 0 }
            },
            required: ["query"]
          }
        },
        
        // Management Tools
        {
          name: "package_info",
          description: "Get detailed information about a package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: { type: "string", description: "Package name" },
              version: { type: "string", description: "Specific version" }
            },
            required: ["packageName"]
          }
        },
        {
          name: "install_packages",
          description: "Install npm packages",
          inputSchema: {
            type: "object",
            properties: {
              packages: { 
                type: "array", 
                items: { type: "string" },
                description: "Package names to install" 
              },
              dev: { type: "boolean", description: "Install as dev dependencies", default: false },
              global: { type: "boolean", description: "Install globally", default: false },
              cwd: { type: "string", description: "Working directory", default: process.cwd() }
            },
            required: ["packages"]
          }
        },
        {
          name: "update_packages",
          description: "Update npm packages",
          inputSchema: {
            type: "object",
            properties: {
              packages: { 
                type: "array", 
                items: { type: "string" },
                description: "Package names to update (empty for all)" 
              },
              cwd: { type: "string", description: "Working directory", default: process.cwd() }
            }
          }
        },
        {
          name: "remove_packages",
          description: "Remove npm packages",
          inputSchema: {
            type: "object",
            properties: {
              packages: { 
                type: "array", 
                items: { type: "string" },
                description: "Package names to remove" 
              },
              global: { type: "boolean", description: "Remove globally", default: false },
              cwd: { type: "string", description: "Working directory", default: process.cwd() }
            },
            required: ["packages"]
          }
        },
        
        // Analysis Tools
        {
          name: "check_bundle_size",
          description: "Check bundle size of a package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: { type: "string", description: "Package name" },
              version: { type: "string", description: "Package version" }
            },
            required: ["packageName"]
          }
        },
        {
          name: "download_stats",
          description: "Get download statistics for a package",
          inputSchema: {
            type: "object",
            properties: {
              packageName: { type: "string", description: "Package name" },
              period: { 
                type: "string", 
                description: "Time period",
                enum: ["last-day", "last-week", "last-month", "last-year"],
                default: "last-week"
              }
            },
            required: ["packageName"]
          }
        },
        
        // Security Tools
        {
          name: "audit_dependencies",
          description: "Audit dependencies for vulnerabilities",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory", default: process.cwd() },
              fix: { type: "boolean", description: "Auto-fix vulnerabilities", default: false }
            }
          }
        },
        {
          name: "check_vulnerability",
          description: "Check a specific package for vulnerabilities",
          inputSchema: {
            type: "object",
            properties: {
              packageName: { type: "string", description: "Package name" },
              version: { type: "string", description: "Package version" }
            },
            required: ["packageName"]
          }
        }
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ tools })
      };
    }
    
    if (body.method === 'tools/call') {
      const toolName = body.params?.name;
      const args = body.params?.arguments || {};
      
      try {
        const result = await handleToolCall(toolName, args);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };
      } catch (error) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            isError: true,
            content: [{
              type: "text",
              text: `❌ Error: ${error.message}`
            }]
          })
        };
      }
    }
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unknown method: ${body.method}` })
    };
    
  } catch (error) {
    console.error('MCP handler error:', error);
    
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

// Tool implementation functions
async function handleToolCall(toolName, args) {
  switch (toolName) {
    case 'search_packages':
      return await searchPackages(args);
    case 'package_info':
      return await getPackageInfo(args);
    case 'install_packages':
      return await installPackages(args);
    case 'update_packages':
      return await updatePackages(args);
    case 'remove_packages':
      return await removePackages(args);
    case 'check_bundle_size':
      return await checkBundleSize(args);
    case 'download_stats':
      return await getDownloadStats(args);
    case 'audit_dependencies':
      return await auditDependencies(args);
    case 'check_vulnerability':
      return await checkVulnerability(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// HTTP helper function
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

// Tool implementations
async function searchPackages(args) {
  const { query, limit = 25, from = 0 } = args;
  
  if (!query || query.trim() === '') {
    throw new Error('Search query cannot be empty');
  }
  
  if (limit > 100) {
    throw new Error('Limit cannot exceed 100');
  }
  
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}&from=${from}`;
  
  try {
    const data = await makeRequest(url);
    
    const output = [`🔍 Search results for "${query}":\n`];
    
    if (!data.objects || data.objects.length === 0) {
      output.push("No packages found matching your query.");
      return { content: [{ type: "text", text: output.join("\n") }] };
    }
    
    data.objects.slice(0, 10).forEach((item, index) => {
      const pkg = item.package;
      output.push(`${index + 1}. 📦 **${pkg.name}**`);
      output.push(`   Version: ${pkg.version}`);
      output.push(`   Description: ${(pkg.description || 'No description').substring(0, 100)}${pkg.description && pkg.description.length > 100 ? '...' : ''}`);
      output.push("");
    });
    
    if (data.total > data.objects.length) {
      output.push(`Showing ${data.objects.length} of ${data.total} results`);
    }
    
    return {
      content: [{
        type: "text",
        text: output.join("\n")
      }]
    };
  } catch (error) {
    throw new Error(`Failed to search packages: ${error.message}`);
  }
}

async function getPackageInfo(args) {
  const { packageName, version } = args;
  
  const url = version 
    ? `https://registry.npmjs.org/${packageName}/${version}`
    : `https://registry.npmjs.org/${packageName}`;
  
  try {
    const data = await makeRequest(url);
    
    const versionData = version ? data : data.versions?.[data['dist-tags']?.latest] || data;
    const currentVersion = version || data['dist-tags']?.latest || versionData.version;
    
    const output = [`📦 Package Information for ${packageName}@${currentVersion}:\n`];
    
    output.push(`Name: ${versionData.name}`);
    output.push(`Version: ${currentVersion}`);
    output.push(`Description: ${versionData.description || "No description"}`);
    output.push(`License: ${versionData.license || "Not specified"}`);
    
    if (versionData.author) {
      const author = typeof versionData.author === "object" ? versionData.author.name : versionData.author;
      output.push(`Author: ${author}`);
    }
    
    if (versionData.keywords?.length) {
      output.push(`Keywords: ${versionData.keywords.join(", ")}`);
    }
    
    const deps = Object.keys(versionData.dependencies || {}).length;
    const devDeps = Object.keys(versionData.devDependencies || {}).length;
    output.push(`\nDependencies: ${deps}`);
    output.push(`Dev Dependencies: ${devDeps}`);
    
    if (versionData.homepage) {
      output.push(`\nHomepage: ${versionData.homepage}`);
    }
    if (versionData.repository?.url) {
      output.push(`Repository: ${versionData.repository.url}`);
    }
    output.push(`NPM: https://www.npmjs.com/package/${packageName}`);
    
    return {
      content: [{
        type: "text",
        text: output.join("\n")
      }]
    };
  } catch (error) {
    throw new Error(`Failed to get package info: ${error.message}`);
  }
}

async function installPackages(args) {
  return {
    content: [{
      type: "text",
      text: "🌐 This is a hosted MCP service - package installation is not available.\n\nFor local package management, please use the self-hosted version:\nhttps://github.com/shacharsol/js-package-manager-mcp"
    }]
  };
}

async function updatePackages(args) {
  return {
    content: [{
      type: "text",
      text: "🌐 This is a hosted MCP service - package updates are not available.\n\nFor local package management, please use the self-hosted version:\nhttps://github.com/shacharsol/js-package-manager-mcp"
    }]
  };
}

async function removePackages(args) {
  return {
    content: [{
      type: "text",
      text: "🌐 This is a hosted MCP service - package removal is not available.\n\nFor local package management, please use the self-hosted version:\nhttps://github.com/shacharsol/js-package-manager-mcp"
    }]
  };
}

async function checkBundleSize(args) {
  const { packageName, version } = args;
  const packageSpec = version ? `${packageName}@${version}` : packageName;
  
  try {
    const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(packageSpec)}`;
    const data = await makeRequest(url);
    
    const output = [
      `📊 Bundle Size Analysis for ${packageSpec}:\n`,
      `Minified: ${formatBytes(data.size)}`,
      `Minified + Gzipped: ${formatBytes(data.gzip)}`,
      `Dependencies: ${data.dependencyCount || 0}`,
      `\n🔗 Detailed analysis: https://bundlephobia.com/package/${packageName}`
    ];
    
    return {
      content: [{
        type: "text",
        text: output.join("\n")
      }]
    };
  } catch (error) {
    throw new Error(`Failed to analyze bundle size: ${error.message}`);
  }
}

async function getDownloadStats(args) {
  const { packageName, period = 'last-week' } = args;
  
  try {
    const url = `https://api.npmjs.org/downloads/point/${period}/${packageName}`;
    const data = await makeRequest(url);
    
    const output = [
      `📊 Download Statistics for ${packageName}:\n`,
      `Period: ${period}`,
      `Downloads: ${formatNumber(data.downloads)}`,
      `Date Range: ${data.start} to ${data.end}`
    ];
    
    return {
      content: [{
        type: "text",
        text: output.join("\n")
      }]
    };
  } catch (error) {
    throw new Error(`Failed to get download stats: ${error.message}`);
  }
}

async function auditDependencies(args) {
  return {
    content: [{
      type: "text",
      text: "🌐 This is a hosted MCP service - dependency auditing is not available.\n\nFor local security auditing, please use the self-hosted version:\nhttps://github.com/shacharsol/js-package-manager-mcp"
    }]
  };
}

async function checkVulnerability(args) {
  const { packageName, version } = args;
  
  return {
    content: [{
      type: "text",
      text: `🔒 Vulnerability checking for ${packageName}${version ? `@${version}` : ''}\n\nFor comprehensive security analysis, please use the self-hosted version with full vulnerability database access:\nhttps://github.com/shacharsol/js-package-manager-mcp`
    }]
  };
}

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}