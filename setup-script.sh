#!/bin/bash

echo "🚀 Setting up JavaScript Package Manager MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Create config directory if it doesn't exist
CONFIG_DIR=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_DIR="$HOME/.config/Claude"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    CONFIG_DIR="$APPDATA/Claude"
fi

if [ ! -z "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
    
    # Get the absolute path of the current directory
    CURRENT_DIR=$(pwd)
    
    # Create example config
    cat > "$CONFIG_DIR/claude_desktop_config.example.json" << EOF
{
  "mcpServers": {
    "package-manager": {
      "command": "node",
      "args": ["$CURRENT_DIR/dist/index.js"],
      "env": {}
    }
  }
}
EOF
    
    echo "📝 Example configuration created at:"
    echo "   $CONFIG_DIR/claude_desktop_config.example.json"
    echo ""
    echo "⚠️  To activate the MCP server:"
    echo "   1. Copy the example config to claude_desktop_config.json"
    echo "   2. Restart Claude Desktop"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "   - Review the README.md for usage instructions"
echo "   - Configure Claude Desktop with the MCP server"
echo "   - Try asking Claude to 'search for React packages'"