# JavaScript Package Manager MCP Server

A comprehensive MCP (Model Context Protocol) server for managing JavaScript packages across NPM, Yarn, and pnpm. This server provides AI assistants with powerful tools to search, install, analyze, and manage JavaScript dependencies.

## Features

### 🔍 Package Search
- Search npm registry with relevance scoring
- View package metadata, keywords, and maintainers
- Pagination support for large result sets

### 📦 Package Management
- Install packages (with dev/global options)
- Update packages to latest versions
- Remove unwanted packages
- Check for outdated dependencies

### 🔒 Security Tools
- Audit dependencies for vulnerabilities
- Auto-fix security issues (with force option)
- Check specific packages for known vulnerabilities
- Integration with GitHub Advisory Database

### 📊 Analysis Tools
- Visualize dependency trees
- Check bundle sizes before installation
- Analyze for circular dependencies
- Track download statistics
- Detect orphaned files

### 📜 Management Utilities
- List and analyze licenses
- Clean package manager caches
- Get detailed package information
- Support for all major package managers

## Installation

### Option 1: Use Hosted Service (Recommended)
No installation required! Use our hosted MCP server on Netlify:

```json
{
  "mcpServers": {
    "javascript-package-manager": {
      "transport": "http", 
      "url": "https://js-package-manager-mcp.netlify.app/.netlify/functions/mcp"
    }
  }
}
```

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/finsavvyai/js-package-manager-mcp)

### Option 2: Local Installation
```bash
# Clone the repository
git clone https://github.com/finsavvyai/js-package-manager-mcp.git
cd js-package-manager-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "package-manager": {
      "command": "node",
      "args": ["/path/to/mcp-package-manager/dist/index.js"],
      "env": {}
    }
  }
}
```

### For Multiple Editors (Windsurf, VS Code, Cursor, etc.)

This project includes configuration files for popular editors:

#### Quick Setup
```bash
# Run the automated setup script
./setup-mcp.sh
```

#### Manual Configuration

**Windsurf**: Configuration in `.windsurfrc`
**VS Code**: Configuration in `.vscode/settings.json`  
**Cursor**: Configuration in `.cursorrules`
**Cline**: Use the `mcp-config.json` file

#### Universal MCP Configuration
```json
{
  "mcp": {
    "servers": {
      "javascript-package-manager": {
        "command": "node",
        "args": ["./dist/index.js"],
        "cwd": "/path/to/mcp-package-manager"
      }
    }
  }
}
```

## Available Tools

### search_packages
Search for packages in the npm registry.
```
Arguments:
- query: Search query string
- limit: Maximum results (1-100, default: 25)
- from: Offset for pagination (default: 0)
```

### install_packages
Install npm packages in a project.
```
Arguments:
- packages: Array of package names (with optional versions)
- cwd: Working directory (default: current)
- dev: Install as dev dependencies (default: false)
- global: Install globally (default: false)
```

### update_packages
Update packages to their latest versions.
```
Arguments:
- packages: Specific packages to update (optional)
- cwd: Working directory (default: current)
```

### remove_packages
Remove packages from a project.
```
Arguments:
- packages: Array of package names to remove
- cwd: Working directory (default: current)
- global: Remove global packages (default: false)
```

### check_outdated
Check for outdated packages.
```
Arguments:
- cwd: Working directory (default: current)
- global: Check global packages (default: false)
```

### audit_dependencies
Audit project dependencies for vulnerabilities.
```
Arguments:
- cwd: Working directory (default: current)
- fix: Attempt to fix vulnerabilities (default: false)
- force: Force fixes including breaking changes (default: false)
- production: Only audit production dependencies (default: false)
```

### check_vulnerability
Check a specific package for known vulnerabilities.
```
Arguments:
- packageName: Package name to check
- version: Specific version (optional)
```

### dependency_tree
Display the dependency tree of a project.
```
Arguments:
- cwd: Working directory (default: current)
- depth: Maximum tree depth (0-10, default: 3)
- production: Only show production dependencies (default: false)
```

### check_bundle_size
Check the bundle size of a package.
```
Arguments:
- packageName: Package name to analyze
- version: Specific version (optional)
```

### analyze_dependencies
Analyze project dependencies for issues.
```
Arguments:
- cwd: Working directory (default: current)
- circular: Check for circular dependencies (default: true)
- orphans: Check for orphaned files (default: true)
```

### download_stats
Get download statistics for a package.
```
Arguments:
- packageName: Package name
- period: Time period (last-day, last-week, last-month, last-year)
```

### list_licenses
List licenses of all dependencies.
```
Arguments:
- cwd: Working directory (default: current)
- production: Only check production dependencies (default: false)
- summary: Show summary of license types (default: true)
```

### check_license
Check the license of a specific package.
```
Arguments:
- packageName: Package name to check
- version: Specific version (optional)
```

### clean_cache
Clean the package manager cache.
```
Arguments:
- cwd: Working directory (default: current)
- global: Clean global cache (default: false)
```

### package_info
Get detailed information about a package.
```
Arguments:
- packageName: Package name
- version: Specific version (optional)
```

## Usage Examples

### With Claude Desktop

Once configured, you can ask Claude:

- "Search for React testing libraries"
- "Check if lodash has any security vulnerabilities"
- "What's the bundle size of moment.js?"
- "Install typescript as a dev dependency"
- "Show me all MIT licensed packages in this project"
- "Find circular dependencies in my code"
- "Update all packages to their latest versions"

### Programmatic Usage

```typescript
import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = await createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## Architecture

The server is built with:
- **TypeScript** for type safety
- **MCP SDK** for protocol implementation
- **Zod** for input validation
- **Execa** for package manager command execution
- **Node-cache** for response caching
- **Pacote** for npm registry interactions

## Performance Features

- **Intelligent caching**: Reduces API calls with configurable TTLs
- **Rate limiting**: Prevents API throttling with concurrent request limits
- **Efficient token usage**: Concise responses optimized for AI context windows
- **Parallel operations**: Batch processing for improved performance

## Security Considerations

- All package manager commands are executed in isolated processes
- Input validation prevents command injection
- Vulnerability data sourced from official databases
- No credentials or sensitive data are stored

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details