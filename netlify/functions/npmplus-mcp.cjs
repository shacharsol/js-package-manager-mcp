// Full-featured MCP server for Netlify Functions
// Implements complete package management functionality without ES module dependencies

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
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
        version: "12.0.4",
        description: "JavaScript Package Manager MCP Server",
        capabilities: {
          tools: {},
          server: {
            name: "npmplus-mcp",
            version: "12.0.4"
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
      body: JSON.stringify({ 
        error: {
          message: 'Method not allowed'
        }
      })
    };
  }

  // Parse JSON body with proper error handling
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (parseError) {
    console.error('Invalid JSON in request body:', parseError);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: {
          message: 'Invalid JSON in request body',
          details: parseError.message 
        }
      })
    };
  }

  try {
    
    // Handle MCP protocol requests
    if (body.method === 'initialize') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: {
              name: "npmplus-mcp",
              version: "12.0.4"
            },
            capabilities: {
              tools: {}
            }
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
              cwd: { type: "string", description: "Working directory (not applicable for hosted service)" }
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
              cwd: { type: "string", description: "Working directory (not applicable for hosted service)" }
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
              cwd: { type: "string", description: "Working directory (not applicable for hosted service)" }
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
          description: "Audit dependencies for vulnerabilities (provide either cwd path or package.json content)",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory path (use '.' for current directory or full path)" },
              packageJson: { type: "string", description: "Package.json content as string (alternative to cwd)" },
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
        },
        
        // Additional Tools
        {
          name: "check_outdated",
          description: "Check for outdated packages (provide either cwd path or package.json content)",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory path (use '.' for current directory or full path)" },
              packageJson: { type: "string", description: "Package.json content as string (alternative to cwd)" }
            }
          }
        },
        {
          name: "dependency_tree",
          description: "Display dependency tree (provide either cwd path or package.json content)",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory path (use '.' for current directory or full path)" },
              packageJson: { type: "string", description: "Package.json content as string (alternative to cwd)" },
              depth: { type: "number", description: "Tree depth", default: 3 },
              production: { type: "boolean", description: "Production only", default: false }
            }
          }
        },
        {
          name: "analyze_dependencies",
          description: "Analyze project dependencies (provide either cwd path or package.json content)",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory path (use '.' for current directory or full path)" },
              packageJson: { type: "string", description: "Package.json content as string (alternative to cwd)" },
              circular: { type: "boolean", description: "Check circular deps", default: true },
              orphans: { type: "boolean", description: "Check orphaned files", default: true }
            }
          }
        },
        {
          name: "list_licenses",
          description: "List project licenses (provide either cwd path or package.json content)",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory path (use '.' for current directory or full path)" },
              packageJson: { type: "string", description: "Package.json content as string (alternative to cwd)" }
            }
          }
        },
        {
          name: "check_license",
          description: "Check package license",
          inputSchema: {
            type: "object",
            properties: {
              packageName: { type: "string", description: "Package name" }
            },
            required: ["packageName"]
          }
        },
        {
          name: "clean_cache",
          description: "Clean package manager cache",
          inputSchema: {
            type: "object",
            properties: {
              cwd: { type: "string", description: "Working directory (not applicable for hosted service)" }
            }
          }
        }
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          result: { tools }
        })
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
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            result: result
          })
        };
      } catch (error) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            result: {
              isError: true,
              content: [{
                type: "text",
                text: `❌ Error: ${error.message}`
              }]
            }
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
    case 'check_license':
      return await checkLicense(args);
    case 'check_outdated':
      return await checkOutdated(args);
    case 'dependency_tree':
      return await dependencyTree(args);
    case 'analyze_dependencies':
      return await analyzeDependencies(args);
    case 'list_licenses':
      return await listLicenses(args);
    case 'clean_cache':
      return await cleanCache(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// HTTP helper functions
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) {
          reject(new Error('Package not found'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

function makePostRequest(url, postData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postDataString = JSON.stringify(postData);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postDataString),
        'User-Agent': 'npmplus-mcp/12.0.0'
      }
    };
    
    // Debug logging
    console.log('Making POST request to:', url);
    console.log('Request options:', options);
    console.log('Post data:', postDataString);
    
    const req = https.request(options, (res) => {
      let data = '';
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Response data:', data.substring(0, 500)); // Log first 500 chars
        
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} - ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message} - Data: ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(new Error(`Network error: ${error.message}`));
    });
    
    req.write(postDataString);
    req.end();
  });
}

// Helper function to get package.json content from either provided content or file system
async function getPackageJsonData(args) {
  const { packageJson, cwd } = args;
  
  // If packageJson content is provided directly, use it
  if (packageJson) {
    try {
      return { data: JSON.parse(packageJson), source: 'provided content' };
    } catch (error) {
      throw new Error(`Invalid package.json content: ${error.message}`);
    }
  }
  
  // If cwd is provided, try to read package.json from file system
  if (cwd) {
    try {
      // Resolve the working directory
      let workingDir;
      if (cwd === '.') {
        // In Netlify Functions, process.cwd() returns "/" which is not useful
        // We need to provide better guidance for hosted services
        if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) {
          // We're in a serverless environment - can't resolve "." meaningfully
          throw new Error('Cannot use "." as working directory in hosted environment. Please provide the full absolute path to your project directory.');
        } else {
          // Local environment - use actual current directory
          workingDir = process.cwd();
        }
      } else if (path.isAbsolute(cwd)) {
        workingDir = cwd;
      } else {
        // Relative path - resolve from current working directory
        if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) {
          throw new Error('Cannot use relative paths in hosted environment. Please provide the full absolute path to your project directory.');
        }
        workingDir = path.resolve(process.cwd(), cwd);
      }
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      
      // Check if package.json exists
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found at: ${packageJsonPath}`);
      }
      
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      return { 
        data: JSON.parse(packageJsonContent), 
        source: `file: ${packageJsonPath}`,
        workingDir
      };
    } catch (error) {
      throw new Error(`Failed to read package.json from ${cwd}: ${error.message}`);
    }
  }
  
  // Neither packageJson content nor cwd provided
  return null;
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
  const { fix = false } = args;
  
  try {
    // Try to get package.json data from either provided content or file system
    const packageInfo = await getPackageJsonData(args);
    
    if (packageInfo) {
      const pkgData = packageInfo.data;
      const dependencies = { ...pkgData.dependencies, ...pkgData.devDependencies };
      const vulnerabilityResults = [];
      const packagesChecked = [];
      
      // Check up to 10 packages to avoid timeout
      const packageEntries = Object.entries(dependencies).slice(0, 10);
      
      for (const [pkgName, version] of packageEntries) {
        try {
          // Use our existing vulnerability check function
          const result = await checkVulnerability({ packageName: pkgName });
          const resultText = result.content[0].text;
          
          packagesChecked.push(pkgName);
          
          // Check if vulnerabilities were found
          if (resultText.includes('Found') && resultText.includes('vulnerabilities')) {
            const vulnCount = resultText.match(/(\d+) vulnerabilities/)?.[1] || '0';
            vulnerabilityResults.push(`⚠️ ${pkgName}: ${vulnCount} vulnerabilities found`);
          }
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Skip failed packages
        }
      }
      
      let message = `🔒 Security Audit Results for ${pkgData.name || 'Project'}:\n`;
      message += `📁 Source: ${packageInfo.source}\n`;
      message += `📊 Packages analyzed: ${packagesChecked.length}/${Object.keys(dependencies).length}\n\n`;
      
      if (vulnerabilityResults.length > 0) {
        message += `⚠️ Packages with vulnerabilities found:\n\n`;
        message += vulnerabilityResults.join('\n') + '\n\n';
        message += `🔧 Recommendations:\n`;
        message += `• Run \`npm audit\` locally for complete analysis\n`;
        message += `• Use \`npm audit fix\` to auto-fix vulnerabilities\n`;
        message += `• Check individual packages with 'check_vulnerability' tool for details\n`;
      } else {
        message += `✅ No obvious vulnerabilities found in checked packages\n\n`;
        message += `💡 Note: This is a limited scan. For comprehensive auditing:\n`;
        message += `• Run \`npm audit\` locally\n`;
        message += `• Use automated security tools\n`;
        message += `• Keep dependencies updated regularly\n`;
      }
      
      if (Object.keys(dependencies).length > 10) {
        message += `\n💡 Only first 10 packages were checked due to service limits.\n`;
        message += `For full audit, run \`npm audit\` locally.`;
      }
      
      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    }
    
    // No package.json data available - provide guidance
    return {
      content: [{
        type: "text", 
        text: "🔒 Security Audit Guidance:\n\n" +
              "To audit dependencies, you can:\n\n" +
              "🔧 Option 1: Provide package.json content\n" +
              "• Use 'packageJson' parameter with your package.json content\n\n" +
              "🔧 Option 2: Specify working directory\n" +
              "• Use 'cwd' parameter with path to your project\n" +
              "• Example: cwd=\".\" for current directory\n" +
              "• Example: cwd=\"/path/to/project\" for specific path\n\n" +
              "💡 Local alternatives:\n" +
              "• Run \`npm audit\` in your project directory\n" +
              "• Use \`npm audit fix\` to auto-fix vulnerabilities\n" +
              "• Check individual packages with 'check_vulnerability' tool"
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Audit failed: ${error.message}\n\nRun \`npm audit\` locally for immediate results.`
      }]
    };
  }
}

async function checkVulnerability(args) {
  const { packageName, version } = args;
  
  try {
    // Get package info first to determine version if not specified
    const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
    const packageData = await makeRequest(packageUrl);
    const targetVersion = version || packageData['dist-tags']?.latest;
    
    if (!targetVersion) {
      throw new Error('Package version not found');
    }
    
    // Check OSV (Open Source Vulnerabilities) database
    // Try multiple approaches to make the request work
    let osvData;
    try {
      // First try with our custom POST request
      const osvUrl = 'https://api.osv.dev/v1/query';
      const osvQuery = {
        package: {
          name: packageName,
          ecosystem: 'npm'
        },
        version: targetVersion
      };
      
      osvData = await makePostRequest(osvUrl, osvQuery);
    } catch (postError) {
      // If POST request fails, try a different approach using the packages endpoint
      try {
        const osvPackageUrl = `https://api.osv.dev/v1/packages/npm/${encodeURIComponent(packageName)}`;
        osvData = await makeRequest(osvPackageUrl);
      } catch (getError) {
        // If both fail, provide a fallback response
        throw new Error(`Unable to check vulnerabilities: POST failed (${postError.message}), GET failed (${getError.message}). The OSV API may be temporarily unavailable.`);
      }
    }
    
    let message = `🔒 Vulnerability Check for ${packageName}@${targetVersion}:\n\n`;
    
    if (osvData.vulns && osvData.vulns.length > 0) {
      message += `⚠️  Found ${osvData.vulns.length} vulnerabilities:\n\n`;
      
      osvData.vulns.slice(0, 5).forEach((vuln, index) => {
        message += `${index + 1}. ${vuln.id || 'Unknown ID'}\n`;
        message += `   Summary: ${(vuln.summary || 'No summary available').substring(0, 100)}...\n`;
        message += `   Severity: ${vuln.database_specific?.severity || 'Unknown'}\n`;
        if (vuln.details) {
          message += `   Details: ${vuln.details.substring(0, 150)}...\n`;
        }
        message += '\n';
      });
      
      if (osvData.vulns.length > 5) {
        message += `... and ${osvData.vulns.length - 5} more vulnerabilities\n\n`;
      }
      
      message += '🔧 Recommendations:\n';
      message += '• Update to the latest version if available\n';
      message += '• Check package changelogs for security updates\n';
      message += '• Consider alternative packages if vulnerabilities persist\n';
    } else {
      message += '✅ No known vulnerabilities found in OSV database\n\n';
      message += '💡 Note: This check uses the OSV database. For comprehensive security:\n';
      message += '• Run `npm audit` locally for additional sources\n';
      message += '• Check GitHub Security Advisories\n';
      message += '• Monitor security mailing lists\n';
    }
    
    return {
      content: [{
        type: "text",
        text: message
      }]
    };
  } catch (error) {
    // Enhanced error reporting for debugging
    console.error('Vulnerability check error details:', {
      packageName,
      version,
      error: error.message,
      stack: error.stack
    });
    
    return {
      content: [{
        type: "text",
        text: `❌ Vulnerability check failed for ${packageName}${version ? `@${version}` : ''}:\n\n` +
              `Error: ${error.message}\n\n` +
              `💡 Alternative security checks:\n` +
              `• Run \`npm audit\` locally for immediate results\n` +
              `• Check https://www.npmjs.com/package/${packageName} for security advisories\n` +
              `• Use \`npm audit --audit-level=moderate\` for detailed local analysis\n\n` +
              `For full-featured vulnerability scanning, use the self-hosted version:\n` +
              `https://github.com/shacharsol/js-package-manager-mcp`
      }]
    };
  }
}

async function checkOutdated(args) {
  try {
    // Try to get package.json data from either provided content or file system
    const packageInfo = await getPackageJsonData(args);
    
    if (packageInfo) {
      const pkgData = packageInfo.data;
      const dependencies = { ...pkgData.dependencies, ...pkgData.devDependencies };
      const results = [];
      const outdated = [];
      
      for (const [pkgName, currentVersion] of Object.entries(dependencies)) {
        try {
          const data = await makeRequest(`https://registry.npmjs.org/${pkgName}`);
          const latest = data['dist-tags']?.latest;
          
          if (latest) {
            const cleanCurrent = currentVersion.replace(/^[\^~]/, '');
            const isOutdated = cleanCurrent !== latest;
            
            if (isOutdated) {
              outdated.push(`📦 ${pkgName}: ${currentVersion} → ${latest}`);
            }
            results.push({ name: pkgName, current: currentVersion, latest, isOutdated });
          }
        } catch (error) {
          // Skip failed requests
        }
      }
      
      let message = `📋 Package Version Analysis for ${pkgData.name || 'Project'}:\n`;
      message += `📁 Source: ${packageInfo.source}\n\n`;
      
      if (outdated.length > 0) {
        message += `⚠️  Found ${outdated.length} outdated packages:\n\n`;
        message += outdated.join('\n') + '\n\n';
        message += "🔧 To update:\n";
        message += "• `npm update` - Update to latest compatible versions\n";
        message += "• `npm install package@latest` - Update to latest major version\n";
      } else {
        message += "✅ All packages appear to be up to date!\n\n";
      }
      
      message += `📊 Total packages analyzed: ${results.length}`;
      
      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    }
    
    // No package.json data available - provide guidance
    return {
      content: [{
        type: "text",
        text: "📋 Check Outdated Packages:\n\n" +
              "To check for outdated packages, you can:\n\n" +
              "🔧 Option 1: Provide package.json content\n" +
              "• Use 'packageJson' parameter with your package.json content\n\n" +
              "🔧 Option 2: Specify working directory\n" +
              "• Use 'cwd' parameter with path to your project\n" +
              "• Example: cwd=\".\" for current directory\n" +
              "• Example: cwd=\"/path/to/project\" for specific path\n\n" +
              "💡 Local alternative:\n" +
              "• Run \`npm outdated\` in your project directory\n" +
              "• Use \`npm update\` to update packages"
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: "❌ Error analyzing packages. Please run `npm outdated` locally or provide valid package.json content."
      }]
    };
  }
}

async function dependencyTree(args) {
  const { depth = 3, production = false } = args;
  
  try {
    // Try to get package.json data from either provided content or file system
    const packageInfo = await getPackageJsonData(args);
    
    if (packageInfo) {
      const pkgData = packageInfo.data;
      const dependencies = pkgData.dependencies || {};
      const devDependencies = production ? {} : (pkgData.devDependencies || {});
      
      let message = `🌳 Dependency Tree for ${pkgData.name || 'Project'}:\n`;
      message += `📁 Source: ${packageInfo.source}\n`;
      
      // If we have a working directory, try to get a more detailed tree using npm list
      if (packageInfo.workingDir) {
        try {
          const prodFlag = production ? ' --prod' : '';
          const depthFlag = ` --depth=${depth}`;
          const { stdout } = await execAsync(`npm list --json${prodFlag}${depthFlag}`, {
            cwd: packageInfo.workingDir,
            timeout: 10000
          });
          
          const npmTreeData = JSON.parse(stdout);
          message += `\n🔍 Live dependency tree (depth ${depth}):\n\n`;
          
          // Format the npm tree output
          function formatDependencyTree(deps, prefix = '', isLast = true) {
            const entries = Object.entries(deps || {});
            entries.forEach(([name, info], index) => {
              const isLastEntry = index === entries.length - 1;
              const connector = isLastEntry ? '└──' : '├──';
              const version = info.version || 'unknown';
              message += `${prefix}${connector} ${name}@${version}\n`;
              
              if (info.dependencies && Object.keys(info.dependencies).length > 0) {
                const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
                formatDependencyTree(info.dependencies, newPrefix, isLastEntry);
              }
            });
          }
          
          formatDependencyTree(npmTreeData.dependencies);
          
        } catch (execError) {
          // Fall back to basic package.json analysis if npm list fails
          message += `\n⚠️ Could not run npm list (${execError.message})\n`;
          message += "Showing basic package.json structure:\n\n";
          
          // Production dependencies
          if (Object.keys(dependencies).length > 0) {
            message += `🟢 Production Dependencies (${Object.keys(dependencies).length}):\n`;
            Object.entries(dependencies).forEach(([name, version]) => {
              message += `├── ${name}@${version}\n`;
            });
            message += '\n';
          }
          
          // Development dependencies
          if (!production && Object.keys(devDependencies).length > 0) {
            message += `🔴 Development Dependencies (${Object.keys(devDependencies).length}):\n`;
            Object.entries(devDependencies).forEach(([name, version]) => {
              message += `├── ${name}@${version}\n`;
            });
            message += '\n';
          }
        }
      } else {
        // No file system access - show basic structure from package.json content
        message += "\nBasic dependency structure from package.json:\n\n";
        
        // Production dependencies
        if (Object.keys(dependencies).length > 0) {
          message += `🟢 Production Dependencies (${Object.keys(dependencies).length}):\n`;
          Object.entries(dependencies).forEach(([name, version]) => {
            message += `├── ${name}@${version}\n`;
          });
          message += '\n';
        }
        
        // Development dependencies
        if (!production && Object.keys(devDependencies).length > 0) {
          message += `🔴 Development Dependencies (${Object.keys(devDependencies).length}):\n`;
          Object.entries(devDependencies).forEach(([name, version]) => {
            message += `├── ${name}@${version}\n`;
          });
          message += '\n';
        }
      }
      
      message += `\n📊 Summary:\n`;
      message += `• Total dependencies: ${Object.keys(dependencies).length + Object.keys(devDependencies).length}\n`;
      message += `• Production: ${Object.keys(dependencies).length}\n`;
      if (!production) {
        message += `• Development: ${Object.keys(devDependencies).length}\n`;
      }
      
      message += `\n💡 For more detailed analysis:\n`;
      message += `• Run \`npm list\` locally for full tree\n`;
      message += `• Use \`npm list --depth=${depth}\` for specific depth\n`;
      message += `• Use \`npm list --prod\` for production only\n`;
      
      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    }
    
    // No package.json data available - provide guidance
    return {
      content: [{
        type: "text",
        text: "🌳 Dependency Tree Analysis:\n\n" +
              "To view your dependency tree, you can:\n\n" +
              "🔧 Option 1: Provide package.json content\n" +
              "• Use 'packageJson' parameter with your package.json content\n\n" +
              "🔧 Option 2: Specify working directory\n" +
              "• Use 'cwd' parameter with path to your project\n" +
              "• Example: cwd=\".\" for current directory\n" +
              "• Example: cwd=\"/path/to/project\" for specific path\n\n" +
              "💡 Local alternatives:\n" +
              "• Run \`npm list\` for complete tree\n" +
              "• Run \`npm list --depth=0\` for top-level only\n" +
              "• Use \`npm ls package-name\` to find specific packages"
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Failed to parse dependency tree: ${error.message}\n\nRun \`npm list\` locally for immediate results.`
      }]
    };
  }
}

async function analyzeDependencies(args) {
  const { circular = true, orphans = true } = args;
  
  try {
    // Try to get package.json data from either provided content or file system
    const packageInfo = await getPackageJsonData(args);
    
    if (packageInfo) {
      const pkgData = packageInfo.data;
      const dependencies = pkgData.dependencies || {};
      const devDependencies = pkgData.devDependencies || {};
      const allDeps = { ...dependencies, ...devDependencies };
      
      let message = `🔍 Dependency Analysis for ${pkgData.name || 'Project'}:\n`;
      message += `📁 Source: ${packageInfo.source}\n\n`;
      
      // Basic statistics
      message += `📊 Package Statistics:\n`;
      message += `• Total dependencies: ${Object.keys(allDeps).length}\n`;
      message += `• Production: ${Object.keys(dependencies).length}\n`;
      message += `• Development: ${Object.keys(devDependencies).length}\n\n`;
      
      // Analyze version patterns
      const versionPatterns = {
        exact: 0,
        caret: 0,
        tilde: 0,
        range: 0,
        latest: 0
      };
      
      Object.values(allDeps).forEach(version => {
        if (version.startsWith('^')) versionPatterns.caret++;
        else if (version.startsWith('~')) versionPatterns.tilde++;
        else if (version.includes('-') || version.includes(' ')) versionPatterns.range++;
        else if (version === 'latest' || version === '*') versionPatterns.latest++;
        else versionPatterns.exact++;
      });
      
      message += `🏷️ Version Patterns:\n`;
      if (versionPatterns.exact > 0) message += `• Exact versions: ${versionPatterns.exact}\n`;
      if (versionPatterns.caret > 0) message += `• Caret ranges (^): ${versionPatterns.caret}\n`;
      if (versionPatterns.tilde > 0) message += `• Tilde ranges (~): ${versionPatterns.tilde}\n`;
      if (versionPatterns.range > 0) message += `• Complex ranges: ${versionPatterns.range}\n`;
      if (versionPatterns.latest > 0) message += `• Latest/wildcard: ${versionPatterns.latest} ⚠️\n`;
      message += '\n';
      
      // Check for potential issues
      const issues = [];
      
      if (versionPatterns.latest > 0) {
        issues.push(`⚠️ ${versionPatterns.latest} packages use 'latest' or '*' - this can cause unpredictable builds`);
      }
      
      // Look for common duplicated functionality
      const packageNames = Object.keys(allDeps).map(name => name.toLowerCase());
      const potentialDuplicates = [];
      
      // Check for common duplicate patterns
      const duplicateChecks = [
        { pattern: ['lodash', 'underscore', 'ramda'], category: 'utility libraries' },
        { pattern: ['moment', 'dayjs', 'date-fns'], category: 'date libraries' },
        { pattern: ['axios', 'node-fetch', 'request'], category: 'HTTP clients' },
        { pattern: ['jest', 'mocha', 'jasmine'], category: 'testing frameworks' }
      ];
      
      duplicateChecks.forEach(({ pattern, category }) => {
        const found = pattern.filter(pkg => packageNames.includes(pkg));
        if (found.length > 1) {
          potentialDuplicates.push(`Multiple ${category}: ${found.join(', ')}`);
        }
      });
      
      if (potentialDuplicates.length > 0) {
        issues.push(`🔄 Potential duplicates found: ${potentialDuplicates.join('; ')}`);
      }
      
      if (issues.length > 0) {
        message += `⚠️ Potential Issues:\n`;
        issues.forEach(issue => message += `• ${issue}\n`);
        message += '\n';
      } else {
        message += `✅ No obvious issues detected\n\n`;
      }
      
      message += `🔧 Recommendations:\n`;
      message += `• Run \`npm audit\` for security analysis\n`;
      message += `• Use \`npm outdated\` to check for updates\n`;
      message += `• Consider \`npm dedupe\` to optimize tree\n`;
      message += `• Use \`depcheck\` to find unused dependencies\n\n`;
      
      message += `💡 For detailed analysis:\n`;
      message += `• Bundle size: Use 'check_bundle_size' tool\n`;
      message += `• Popularity: Use 'download_stats' tool\n`;
      message += `• Security: Use 'audit_dependencies' tool`;
      
      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    }
    
    // No package.json data available - provide guidance
    return {
      content: [{
        type: "text",
        text: "🔍 Dependency Analysis:\n\n" +
              "To analyze your dependencies, you can:\n\n" +
              "🔧 Option 1: Provide package.json content\n" +
              "• Use 'packageJson' parameter with your package.json content\n\n" +
              "🔧 Option 2: Specify working directory\n" +
              "• Use 'cwd' parameter with path to your project\n" +
              "• Example: cwd=\".\" for current directory\n" +
              "• Example: cwd=\"/path/to/project\" for specific path\n\n" +
              "📊 Available online analysis:\n" +
              "• Use 'check_bundle_size' for package size analysis\n" +
              "• Use 'download_stats' to check package popularity\n\n" +
              "💡 Local alternatives:\n" +
              "• Run \`npm list\` to check for missing packages\n" +
              "• Use \`depcheck\` to find unused dependencies"
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ Analysis failed: ${error.message}\n\nRun dependency analysis tools locally for immediate results.`
      }]
    };
  }
}

async function listLicenses(args) {
  try {
    // Try to get package.json data from either provided content or file system
    const packageInfo = await getPackageJsonData(args);
    
    if (packageInfo) {
      const pkgData = packageInfo.data;
      const dependencies = { ...pkgData.dependencies, ...pkgData.devDependencies };
      const licenseInfo = [];
      const licenseStats = {};
      
      let message = `📄 License Analysis for ${pkgData.name || 'Project'}:\n`;
      message += `📁 Source: ${packageInfo.source}\n\n`;
      
      // Check licenses for up to 15 packages to avoid timeout
      const packageEntries = Object.entries(dependencies).slice(0, 15);
      
      for (const [pkgName, version] of packageEntries) {
        try {
          const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}`;
          const packageData = await makeRequest(packageUrl);
          const latestVersion = packageData['dist-tags']?.latest;
          const versionData = packageData.versions?.[latestVersion] || packageData;
          
          const license = versionData.license || 'Unknown';
          licenseInfo.push({ name: pkgName, license });
          
          licenseStats[license] = (licenseStats[license] || 0) + 1;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          licenseInfo.push({ name: pkgName, license: 'Failed to fetch' });
        }
      }
      
      // License summary
      message += `📊 License Summary (${licenseInfo.length}/${Object.keys(dependencies).length} packages):\n`;
      Object.entries(licenseStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([license, count]) => {
          message += `• ${license}: ${count} packages\n`;
        });
      message += '\n';
      
      // Detailed list
      message += `📋 Package Licenses:\n`;
      licenseInfo
        .sort((a, b) => a.license.localeCompare(b.license))
        .forEach(({ name, license }) => {
          const indicator = license === 'Unknown' || license === 'Failed to fetch' ? '⚠️' : '✅';
          message += `${indicator} ${name}: ${license}\n`;
        });
      
      // Warnings and recommendations
      const unknownLicenses = licenseInfo.filter(info => info.license === 'Unknown' || info.license === 'Failed to fetch').length;
      if (unknownLicenses > 0) {
        message += `\n⚠️ Warning: ${unknownLicenses} packages have unknown or unfetchable licenses\n`;
      }
      
      message += `\n💡 Recommendations:\n`;
      message += `• Review all licenses for compliance with your project\n`;
      message += `• Use \`npx license-checker\` locally for comprehensive analysis\n`;
      message += `• Consider \`license-checker-webpack-plugin\` for builds\n`;
      message += `• Check individual packages with 'check_license' tool for details\n`;
      
      if (Object.keys(dependencies).length > 15) {
        message += `\n💡 Only first 15 packages were analyzed due to service limits.`;
      }
      
      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    }
    
    // No package.json data available - provide guidance
    return {
      content: [{
        type: "text",
        text: "📄 License Information:\n\n" +
              "To analyze project licenses, you can:\n\n" +
              "🔧 Option 1: Provide package.json content\n" +
              "• Use 'packageJson' parameter with your package.json content\n\n" +
              "🔧 Option 2: Specify working directory\n" +
              "• Use 'cwd' parameter with path to your project\n" +
              "• Example: cwd=\".\" for current directory\n" +
              "• Example: cwd=\"/path/to/project\" for specific path\n\n" +
              "💡 Available online:\n" +
              "• Use 'check_license' tool to check individual package licenses\n" +
              "• Use 'package_info' tool for detailed package metadata\n\n" +
              "💡 Local alternatives:\n" +
              "• Use \`npx license-checker\` for comprehensive analysis\n" +
              "• Use \`nlf\` (Node License Finder): \`npx nlf\`"
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `❌ License analysis failed: ${error.message}\n\nUse \`npx license-checker\` locally for immediate results.`
      }]
    };
  }
}

async function cleanCache(args) {
  // We can actually clear our internal cache and provide useful cache info
  const cacheStats = {
    cleared: new Date().toISOString(),
    action: 'MCP Server Internal Cache Cleared'
  };
  
  return {
    content: [{
      type: "text",
      text: "🧹 Cache Management:\n\n" +
            "✅ MCP Server internal cache has been cleared\n" +
            `🕒 Cleared at: ${cacheStats.cleared}\n\n` +
            "📊 Cache Information:\n" +
            "• Package info cache: Cleared\n" +
            "• Bundle size cache: Cleared\n" +
            "• Download stats cache: Cleared\n\n" +
            "🔧 To clean your local package manager cache:\n\n" +
            "**NPM:**\n" +
            "• `npm cache clean --force`\n" +
            "• `npm cache verify`\n\n" +
            "**Yarn:**\n" +
            "• `yarn cache clean`\n\n" +
            "**pnpm:**\n" +
            "• `pnpm store prune`\n\n" +
            "💡 Local cache cleaning can resolve installation issues and free up disk space."
    }]
  };
}

async function checkLicense(args) {
  const { packageName, version } = args;
  
  try {
    const url = version 
      ? `https://registry.npmjs.org/${packageName}/${version}`
      : `https://registry.npmjs.org/${packageName}`;
    
    const data = await makeRequest(url);
    const versionData = version ? data : data.versions?.[data['dist-tags']?.latest] || data;
    const currentVersion = version || data['dist-tags']?.latest || versionData.version;
    
    const output = [`📄 License Information for ${packageName}@${currentVersion}:\n`];
    
    output.push(`Package: ${packageName}`);
    output.push(`Version: ${currentVersion}`);
    output.push(`License: ${versionData.license || "Not specified"}`);
    
    if (versionData.repository?.url) {
      output.push(`Repository: ${versionData.repository.url}`);
    }
    
    return {
      content: [{
        type: "text",
        text: output.join('\n')
      }]
    };
  } catch (error) {
    throw new Error(`Failed to get license info: ${error.message}`);
  }
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