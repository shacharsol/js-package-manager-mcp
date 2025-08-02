# NPM Plus MCP Integration

This project includes NPM Plus - an AI-powered JavaScript package manager that integrates with MCP-compatible editors.

## Available Service
- **Hosted Service**: https://api.npmplus.dev/mcp
- **Local Development**: Available via `npm start` (requires build)

## Available MCP Tools

### Package Search & Info
- `search_packages` - Search npm registry with intelligent relevance scoring
- `package_info` - Get detailed package metadata, dependencies, and maintainer info

### Package Management  
- `install_packages` - Install packages with dev/global options
- `update_packages` - Update packages to latest versions
- `remove_packages` - Clean removal of packages

### Security & Analysis
- `audit_dependencies` - Scan for vulnerabilities using GitHub Advisory Database
- `check_vulnerability` - Check specific packages for security issues
- `check_bundle_size` - Analyze package size impact before installation
- `download_stats` - Get package popularity and download statistics

### Advanced Analysis (Local only)
- `dependency_tree` - Visualize dependency relationships  
- `list_licenses` - License compliance analysis
- `analyze_dependencies` - Detect circular dependencies and orphaned files

## Usage Examples

Ask the AI assistant:
- "Search for React testing libraries"
- "What's the bundle size of lodash?"
- "Check if express has any security vulnerabilities"
- "Install typescript as a dev dependency"
- "Show me alternatives to moment.js"
- "Audit my project dependencies for security issues"

## Configuration

For Cursor MCP integration, add to your MCP settings:
```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "transport": "http", 
        "url": "https://api.npmplus.dev/mcp"
      }
    }
  }
}
```

## Local Development

To use the local version instead of hosted:
```bash
npm install
npm run build  
npm start
```

Then update MCP config to use local server:
```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "node",
        "args": ["./dist/index.js"],
        "cwd": "/path/to/this/project"
      }
    }
  }
}
```