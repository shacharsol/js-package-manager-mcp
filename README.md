# NPM Plus - JavaScript Package Manager for AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/shacharsol/js-package-manager-mcp)

> 🚀 **Open-source MCP server for intelligent JavaScript package management**  
> Works seamlessly with Claude, Windsurf, Cursor, VS Code, and any MCP-compatible AI editor.

## ✨ Features

### 🔍 **Smart Package Discovery**
- Search npm registry with intelligent relevance scoring
- View detailed package metadata, keywords, and maintainers
- Pagination support for comprehensive results

### 📦 **Intelligent Package Management**
- Install, update, and remove packages across NPM, Yarn, and pnpm
- Support for dev dependencies, global packages, and version constraints
- Automatic package manager detection

### 🔒 **Security & Compliance**
- Real-time vulnerability scanning using GitHub Advisory Database
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
    "javascript-package-manager": {
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
    "javascript-package-manager": {
      "transport": "http",
      "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```

**Test:** Ask Claude *"Search for React testing libraries"*
</details>

<details>
<summary><strong>🌊 Windsurf</strong></summary>

**For hosted version, create `.windsurfrc` in your project root:**
```json
{
  "mcp": {
    "servers": {
      "javascript-package-manager": {
        "transport": "http",
        "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
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
      "javascript-package-manager": {
        "command": "node",
        "args": [
          "/path/to/javascript-package-manager/dist/index.js"
        ],
        "disabled": false
      }
    }
  }
}
```

**Test:** *"Install express and cors packages"*
</details>

<details>
<summary><strong>🎯 Cursor</strong></summary>

**Method 1: Cursor Settings**
Add to your Cursor MCP configuration:
```json
{
  "mcp": {
    "servers": {
      "javascript-package-manager": {
        "transport": "http",
        "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
      }
    }
  }
}
```

**Method 2: .cursorrules File**
```
# NPM Plus MCP Integration
This project uses NPM Plus (https://api.npmplus.dev/mcp) for AI-powered package management.

Available features:
- Package search and installation
- Security vulnerability scanning  
- Bundle size analysis
- Dependency management
```

**Test:** *"What's the bundle size of lodash?"*
</details>

<details>
<summary><strong>📝 VS Code + 🧬 Cline</strong></summary>

**Install MCP extension and configure:**
```json
{
  "mcp.servers": {
    "javascript-package-manager": {
      "transport": "http",
      "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```
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

**Local MCP Configuration:**
```json
{
  "mcpServers": {
    "javascript-package-manager": {
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

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ About

Created with ❤️ by [Shachar Solomon](https://github.com/shacharsol) in 2025.

**Star this repo** if NPM Plus helps your AI development workflow!

---

**Built with ❤️ for the open source community**