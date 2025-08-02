#!/bin/bash

# Setup script for MCP server integration with various editors

echo "🔧 Setting up JavaScript Package Manager MCP Server..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Get absolute path
PROJECT_PATH=$(pwd)
echo "📁 Project path: $PROJECT_PATH"

# Create configuration for different editors
echo ""
echo "🎯 MCP Server Configuration:"
echo ""

# Claude Desktop
echo "📋 Claude Desktop configuration:"
echo "Add this to your Claude Desktop config file:"
echo ""
cat << EOF
{
  "mcpServers": {
    "javascript-package-manager": {
      "command": "node",
      "args": ["$PROJECT_PATH/dist/index.js"],
      "env": {}
    }
  }
}
EOF

echo ""
echo "Config file locations:"
echo "  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "  Windows: %APPDATA%\\Claude\\claude_desktop_config.json"
echo ""

# VS Code / Windsurf / Cursor
echo "📋 VS Code/Windsurf/Cursor configuration:"
echo "The following config files have been created:"
echo "  - .vscode/settings.json (VS Code)"
echo "  - .windsurfrc (Windsurf)"
echo "  - .cursorrules (Cursor)"
echo "  - mcp-config.json (Generic MCP config)"
echo ""

# Cline
echo "📋 Cline configuration:"
echo "Add this server to your Cline MCP settings:"
echo ""
cat << EOF
{
  "command": "node",
  "args": ["$PROJECT_PATH/dist/index.js"],
  "cwd": "$PROJECT_PATH"
}
EOF

echo ""
echo "🚀 Setup complete! Your MCP server is ready to use."
echo ""
echo "🌐 For hosted service, visit: https://npmplus.dev"
echo "🔗 API endpoint: https://api.npmplus.dev/mcp"
echo ""
echo "📚 Available tools:"
echo "  - search_packages: Search npm registry"
echo "  - install_packages: Install packages"
echo "  - audit_dependencies: Security scanning"
echo "  - check_bundle_size: Bundle analysis"
echo "  - dependency_tree: Dependency visualization"
echo "  - And many more..."
echo ""
echo "💡 Tip: Run 'npm run dev' for development with hot reload"