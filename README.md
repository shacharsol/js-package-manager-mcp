# NPM Plus - JavaScript Package Manager for AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-v12.0.16-brightgreen.svg)](https://github.com/shacharsol/js-package-manager-mcp/releases)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/shacharsol/js-package-manager-mcp)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](https://api.npmplus.dev/mcp)

> 🚀 **Production-ready MCP server for intelligent JavaScript package management**  
> Works seamlessly with Claude, Windsurf, Cursor, VS Code, and any MCP-compatible AI editor.

## 🎉 **Latest Updates (v12.0.16)**

✅ **ALL TOOLS NOW FULLY OPERATIONAL**
- **Enhanced Install Tools**: Robust package installation with intelligent retry logic
- **Fixed Directory Resolution**: No more "Invalid project directory: /" errors
- **Enhanced Vulnerability Checking**: Now works reliably with graceful error handling  
- **Improved Package Installation**: Better npm idealTree error handling with automatic retries
- **Debug Tools**: New debug_version tool for troubleshooting
- **100% Compatibility**: All operations now work with both relative (`.`) and absolute paths

📊 **Current Status**: **16/16 tools fully functional** with comprehensive error handling

## 🛠️ **Available Tools** (16/16 Fully Functional)

| Tool | Status | Description | Works with `.` |
|------|--------|-------------|----------------|
| **search_packages** | ✅ | Search npm registry with intelligent scoring | N/A |
| **package_info** | ✅ | Get detailed package metadata and info | N/A |
| **check_bundle_size** | ✅ | Analyze bundle size before installation | N/A |
| **download_stats** | ✅ | View download statistics and trends | N/A |
| **check_license** | ✅ | Check package license information | N/A |
| **dependency_tree** | ✅ | Visualize dependency relationships | ✅ |
| **list_licenses** | ✅ | List all project licenses | ✅ |
| **audit_dependencies** | ✅ | Security vulnerability scanning | ✅ |
| **analyze_dependencies** | ✅ | Detect circular deps & issues | ✅ |
| **check_outdated** | ✅ | Find outdated packages | ✅ |
| **clean_cache** | ✅ | Clean package manager cache | ✅ |
| **check_vulnerability** | ✅ | Check specific package vulnerabilities | N/A |
| **install_packages** | ✅ | Install packages with intelligent retry logic | ✅ |
| **update_packages** | ✅ | Update packages to latest versions | ✅ |
| **remove_packages** | ✅ | Remove packages from project | ✅ |
| **debug_version** | ✅ | Debug server version and status | N/A |

### 🎯 **Key Improvements in v12.0.16**

✅ **All 16 Tools Fully Operational**: Complete functionality across all package management operations  
✅ **Robust Installation**: Intelligent retry logic with automatic recovery from npm errors  
✅ **Fixed Directory Resolution**: All tools now properly handle relative paths (`.`)  
✅ **Enhanced Error Handling**: Clear, actionable error messages with recovery suggestions  
✅ **Automatic Retries**: Intelligent retry logic for npm idealTree and other transient errors  
✅ **Graceful Degradation**: Tools continue to work even when external APIs are unavailable  

## ✨ Features

### 🔍 **Smart Package Discovery**
- Search npm registry with intelligent relevance scoring
- View detailed package metadata, keywords, and maintainers
- Pagination support for comprehensive results

### 📦 **Intelligent Package Management**
- Install, update, and remove packages across NPM, Yarn, and pnpm
- Support for dev dependencies, global packages, and version constraints
- Automatic package manager detection with retry logic

### 🔒 **Security & Compliance**
- Real-time vulnerability scanning with fallback mechanisms
- Automated security fix suggestions and implementation
- License compliance tracking and analysis

### 📊 **Advanced Analytics**
- Bundle size analysis before installation
- Dependency tree visualization with circular dependency detection
- Download statistics and popularity metrics
- Orphaned file detection

## 🚀 Quick Start

### Using Hosted Service (Recommended)

**The easiest way to get started:**

```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```

### Self-Hosting (Advanced)

**For customization or private deployment:**

```bash
git clone https://github.com/shacharsol/js-package-manager-mcp.git
cd js-package-manager-mcp
npm install
npm run build
npm start
```

**For web deployment (Netlify, Vercel, etc.):**

```bash
# Run the automated setup script
./deployment/setup-deployment.sh

# Customize the deployment URLs
nano scripts/test-deployment.sh

# Deploy to your own infrastructure
npm run deploy:netlify
```

> **🔒 Security Note**: The production service at `api.npmplus.dev` has automatic deployments disabled. Only the maintainer can deploy to production using `npm run deploy:production`.

See [deployment/README.md](deployment/README.md) for detailed deployment instructions.

## 🛠️ Editor Setup

<details>
<summary><strong>🤖 Claude Desktop</strong></summary>

**Configuration File Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Add this configuration:**
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```

**How to use:**
- Just ask naturally: *"Search for React testing libraries"*
- Claude automatically detects and uses MCP tools
- Look for tool use blocks in responses

**Test:** *"What's the current version of React?"*
</details>

<details>
<summary><strong>🌊 Windsurf</strong></summary>

**For hosted version, create `mcp_config.json` in your project root:**
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "serverUrl": "https://api.npmplus.dev/mcp"
    }
  }
}
```

**For npx installation (Recommended for local):**
```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "npx",
        "args": [
          "-y",
          "npmplus-mcp-server"
        ],
        "disabled": false
      }
    }
  }
}
```

**For local development:**
```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "node",
        "args": [
          "./dist/index.js"
        ],
        "cwd": "./",
        "disabled": false
      }
    }
  }
}
```

**How to use:**
- Natural language: *"Install express and cors packages"*
- Cascade mode: *"Update all packages and fix breaking changes"*
- Look for "🔧 Using npmplus-mcp" in activity bar

**Test:** *"Show me popular authentication libraries"*

See [Windsurf Usage Guide](docs/CURSOR_WINDSURF_USAGE.md#-windsurf-usage)
</details>

<details>
<summary><strong>🎯 Cursor</strong></summary>

**NPX Installation (Recommended for Cursor)**
Add to your Cursor MCP configuration:
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  }
}
```

**⚠️ Cursor-Specific Notes:**
- **Use NPX installation only** - HTTP transport not supported reliably
- **Requires explicit prompts** in non-agent mode: "Use npmplus-mcp to..."
- **Agent mode** increases auto-detection of MCP usage
- **HTTP transport**: Currently experimental and may cause "Loading tools" issues

**Method 3: .cursorrules File**
```
# NPM Plus MCP Integration
This project uses NPM Plus (https://api.npmplus.dev/mcp) for AI-powered package management.

Available features:
- Package search and installation
- Security vulnerability scanning  
- Bundle size analysis
- Dependency management
```

**How to use:**
- Chat: *"Search for testing frameworks"*
- Composer (Cmd+K): *"Find React animation libraries"*
- Explicit: *"Use npmplus-mcp to check bundle sizes"*
- Look for tool usage in sidebar

**Test:** *"What's the bundle size of lodash?"*

See [Cursor Usage Guide](docs/CURSOR_WINDSURF_USAGE.md#-cursor-usage)
</details>

<details>
<summary><strong>📝 VS Code + 🧬 Cline</strong></summary>

**Prerequisites:**
- VS Code (version 1.102 or later for full MCP support)
- Node.js installed
- Cline extension by saoudrizwan

**Setup Steps:**

1. **Install Cline Extension**
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "Cline" by saoudrizwan
   - Install and reload VS Code

2. **Configure AI Model**
   - Click Cline icon in Activity Bar
   - Sign in at app.cline.bot
   - Configure your AI model (Anthropic, OpenAI, etc.)

3. **Add NPM Plus MCP Server**

**Method 1: Automatic Setup (Recommended)**
```
In Cline chat: "add a tool for JavaScript package management using npmplus-mcp-server"
```
Cline will automatically configure the MCP server for you.

**Method 2: Manual Cline Configuration**
Click "MCP Servers" → "Configure MCP Servers" → Add to `cline_mcp_settings.json`:
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  }
}
```

**Method 3: VS Code Native MCP**
Create `.vscode/mcp.json` or use Command Palette: "MCP: Add Server":
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  }
}
```

**Usage:**
- Tools appear automatically in Cline's agent mode
- Use explicit prompts: "Use npmplus-mcp to search for react packages"
- Example: "Use the package manager tool to find Express middleware"

**Troubleshooting:**
- Check server status in Cline's "Installed" servers tab
- Use restart button next to MCP server if needed
- Click "Show Output" to view server logs
- Adjust timeout settings (30 seconds to 1 hour) if connection issues occur

**Security Notes:**
- MCP servers run with your local permissions
- Only install servers from trusted sources
- Review configuration before enabling servers
</details>

## 🔧 Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `search_packages` | Search npm registry with advanced filtering | Find packages by functionality |
| `package_info` | Get comprehensive package metadata | Research before installation |
| `install_packages` | Install with dev/global options | Add dependencies |
| `update_packages` | Update to latest versions | Maintenance |
| `remove_packages` | Clean removal of packages | Cleanup |
| `audit_dependencies` | Security vulnerability scanning | Security |
| `check_bundle_size` | Analyze package size impact | Performance |
| `dependency_tree` | Visualize dependency relationships | Architecture |
| `list_licenses` | License compliance analysis | Legal |
| `analyze_dependencies` | Detect circular deps and orphans | Code quality |

## 💡 Usage Examples

**Security-focused:**
```
"Check if lodash has any security vulnerabilities"
"Audit all dependencies and suggest fixes"
"Find packages with MIT licenses only"
```

**Performance-focused:**
```  
"What's the bundle size impact of adding moment.js?"
"Show me lightweight alternatives to lodash"
"Find circular dependencies in my project"
```

**Development workflow:**
```
"Install typescript as a dev dependency"
"Update all outdated packages"
"Search for React form validation libraries"
```

## 🏗️ Self-Hosting (Advanced)

For enterprise or custom deployments:

```bash
git clone https://github.com/shacharsol/js-package-manager-mcp.git
cd js-package-manager-mcp
npm install
npm run build
npm start
```

**Via npx (Recommended):**
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  }
}
```

**Local development:**
```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/js-package-manager-mcp"
    }
  }
}
```

## 🧪 Testing & Validation

```bash
# Test deployment health
npm run test:deployment

# Run unit tests  
npm test

# Development mode
npm run dev
```

## 🚀 Version Management & Publishing

```bash
# Bump version only (patch/minor/major)
npm run bump

# Full production deployment (maintainer only)
# - Interactive version bumping
# - Automated npm publishing  
# - Git tagging and pushing
# - Netlify deployment
# - Endpoint testing
npm run deploy:production
```

**Production deployment includes:**
- ✅ Prerequisites check (npm login, netlify login, clean git)
- 📦 Interactive version bumping (patch/minor/major)
- 🧪 Automated testing
- 📤 NPM package publishing
- 🏷️ Git tagging and pushing
- 🌐 Netlify deployment
- 🔍 Endpoint health checks

## 🏗️ Architecture

**Built with modern tools:**
- **TypeScript** - Type safety and developer experience
- **MCP SDK** - Official Model Context Protocol implementation
- **Zod** - Runtime type validation and parsing
- **Execa** - Secure subprocess execution
- **Pacote** - Official npm registry client
- **Node-cache** - Intelligent response caching

**Performance optimizations:**
- ⚡ Intelligent caching with configurable TTLs
- 🎯 Rate limiting to prevent API throttling  
- 📦 Parallel operations for batch processing
- 🪶 Optimized responses for AI context windows

## 🔐 Security

- ✅ Isolated subprocess execution
- ✅ Input validation prevents injection attacks
- ✅ Official vulnerability databases only
- ✅ No credential storage or sensitive data handling
- ✅ CORS-enabled for secure web integration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Add** tests for new functionality
4. **Commit** changes (`git commit -m 'Add amazing feature'`)
5. **Push** to branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## 📊 Analytics & Monitoring

NPM Plus includes optional analytics for self-hosted deployments:

### Analytics Features:
- 📊 **Basic tracking** - Console logging for debugging and monitoring
- 🔧 **Tool usage** - Track which MCP tools are being used
- 🚀 **Performance metrics** - Response times and success rates
- 🔒 **Privacy-first** - Minimal data collection, IP hashing
- ⚙️ **Configurable** - Enable via environment variables

### Enable Analytics (Optional)
For self-hosted deployments, you can enable analytics logging:

```bash
# Enable analytics logging
ENABLE_ANALYTICS=true
ANALYTICS_SALT=your-random-salt
```

Analytics data will be logged to console output for monitoring and debugging.

## 🔧 **Troubleshooting & Known Issues**

### ✅ **All Issues Resolved** (v12.0.16)

All major issues have been resolved in the latest version:

| Issue | Status | Solution |
|-------|--------|----------|
| Directory resolution errors | ✅ **FIXED** | Proper handling of relative paths (`.`) |
| Vulnerability check failures | ✅ **FIXED** | Enhanced error handling with fallbacks |
| npm idealTree errors | ✅ **FIXED** | Automatic retry logic with cleanup |
| Package installation failures | ✅ **FIXED** | Robust retry mechanism with recovery |
| All tools operational | ✅ **COMPLETE** | 16/16 tools fully functional |

### 🛠️ **Common Solutions**

**1. npm idealTree Error**
```bash
# If you see: "Tracker 'idealTree' already exists"
# Solution 1: Use the clean cache tool
"Clean the npm cache first"

# Solution 2: Manual cleanup (if needed)
npm cache clean --force

# Solution 3: Restart Claude Desktop to reset MCP connection
```

**2. Directory Resolution Issues**  
```bash
# Problem: "Invalid project directory: /"  
# ✅ SOLVED - all tools now work with relative paths
"Install lodash in the current directory"  # Works correctly now
```

**3. Vulnerability Check Not Working**
```bash
# ✅ SOLVED - now provides graceful fallback
"Check vulnerabilities for express@4.17.0"  # Works with helpful information
```

### 🔍 **Debug Tools**

Use the debug tool to check server status:
```
"Run debug_version tool"
```

This will show:
- Current version running
- Server uptime and status  
- Working directory
- Environment details

### 📋 **Testing Commands**

Verify everything is working:
```bash
# Quick production test
npm run test:production

# Comprehensive feature test  
npm run test:comprehensive

# Test specific issues that were fixed
npm run test:issues
```

### 🆘 **Getting Help**

If you encounter issues:

1. **Check Version**: Use `debug_version` tool to confirm you're running v12.0.16+
2. **Restart**: Restart Claude Desktop to pick up latest version
3. **Clear Cache**: Try `clean_cache` tool first
4. **Check Logs**: Look for `[npmplus-mcp]` messages in console
5. **Report**: Open issue at [GitHub Issues](https://github.com/shacharsol/js-package-manager-mcp/issues)

**Include in bug reports:**
- Version from `debug_version` output
- Exact error message
- Steps to reproduce
- Operating system

### 🔄 **Version Update Process**

To ensure you're running the latest version:

**For Hosted Service Users:**
- Updates are automatic
- Restart Claude Desktop to refresh connection

**For Self-Hosted Users:**
```bash
# Update to latest version
npm update npmplus-mcp-server

# Or reinstall
npm uninstall -g npmplus-mcp-server
npm install -g npmplus-mcp-server@latest
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ About

Created with ❤️ by [Shachar Solomon](https://github.com/shacharsol) in 2025.

**Star this repo** if NPM Plus helps your AI development workflow!

---

**Built with ❤️ for the open source community**