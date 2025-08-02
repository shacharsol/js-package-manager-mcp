# NPM Plus - JavaScript Package Manager for AI

[![NPM Plus](https://img.shields.io/badge/NPM%20Plus-MCP%20Server-blue)](https://npmplus.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/shacharsol/js-package-manager-mcp)

> 🚀 **Production-ready MCP server for intelligent JavaScript package management**  
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

### Hosted Service (Recommended)

**No installation required!** Use our production-ready hosted service:

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

🌐 **Dashboard**: [npmplus.dev](https://npmplus.dev) | **API Health**: [api.npmplus.dev/health](https://api.npmplus.dev/health)

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
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```

**Test:** Ask Claude *"Search for React testing libraries"*
</details>

<details>
<summary><strong>🌊 Windsurf</strong></summary>

**Create `.windsurfrc` in your project root:**
```json
{
  "mcp": {
    "servers": {
      "javascript-package-manager": {
        "transport": "http",
        "url": "https://api.npmplus.dev/mcp"
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

**Live Dashboard**: [api.npmplus.dev/analytics](https://api.npmplus.dev/analytics)

Track usage patterns, popular tools, and performance metrics in real-time.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙋‍♂️ About

Created with ❤️ by [Shachar Solomon](https://github.com/shacharsol) in 2025.

**Star this repo** if NPM Plus helps your AI development workflow!

---

[![NPM Plus Analytics](https://api.npmplus.dev/analytics?badge=true)](https://api.npmplus.dev/analytics)