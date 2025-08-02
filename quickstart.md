# Quick Start Guide

## Prerequisites

- Node.js 16+ installed
- npm, yarn, or pnpm installed
- Claude Desktop app (or another MCP-compatible client)

## Installation

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-package-manager.git
cd mcp-package-manager

# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

### Option 2: Manual Setup

```bash
# Clone and install
git clone https://github.com/yourusername/mcp-package-manager.git
cd mcp-package-manager
npm install
npm run build

# Note the full path
pwd  # Copy this path for the next step
```

## Configuration

1. Find your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "package-manager": {
      "command": "node",
      "args": ["/YOUR/FULL/PATH/TO/mcp-package-manager/dist/index.js"],
      "env": {}
    }
  }
}
```

3. Restart Claude Desktop

## Testing

Ask Claude to try these commands:

### Search Operations
- "Search for React testing libraries"
- "Find packages related to markdown parsing"
- "What are the most popular TypeScript utilities?"

### Package Information
- "Check the bundle size of lodash"
- "Show me download stats for express"
- "What's the license for react?"

### Security Checks
- "Check if my project has any vulnerabilities"
- "Does axios have any security issues?"
- "Audit my dependencies and fix vulnerabilities"

### Dependency Management
- "Install prettier as a dev dependency"
- "Update all my packages"
- "Check for outdated packages"
- "Remove the unused-package dependency"

### Analysis
- "Show my dependency tree"
- "Find circular dependencies in my project"
- "List all MIT licensed packages"
- "Analyze my project's dependencies"

## Troubleshooting

### MCP server not appearing in Claude

1. Check the config file path is correct
2. Ensure the path in the config is absolute (not relative)
3. Restart Claude Desktop completely
4. Check Claude's logs for errors

### Permission errors

```bash
# Make sure the built files are executable
chmod +x dist/*.js
```

### Build errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## Development Mode

For development with hot reload:

```bash
npm run dev
```

## Common Use Cases

### Before Installing a Package
Ask: "What's the bundle size of [package-name] and does it have any vulnerabilities?"

### Security Audit
Ask: "Audit my project dependencies and show me all high severity vulnerabilities"

### License Compliance  
Ask: "List all packages that don't have MIT or Apache licenses"

### Dependency Cleanup
Ask: "Find orphaned files and circular dependencies in my project"

### Package Research
Ask: "Compare bundle sizes of moment vs date-fns vs dayjs"

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/mcp-package-manager/issues)
- Documentation: See README.md for full documentation
- MCP Protocol: [modelcontextprotocol.io](https://modelcontextprotocol.io)