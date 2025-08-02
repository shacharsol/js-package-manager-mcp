# NPM Plus MCP - Complete Setup & Usage Guide

## 🚀 What We've Accomplished

### 1. **Unified Server Name: `npmplus-mcp`**
- All configurations now use consistent naming
- Updated in code, documentation, and website

### 2. **NPX Installation Support**
- Works like puppeteer MCP: `npx -y npmplus-mcp-server`
- No local installation needed
- Always uses latest version

### 3. **Full Editor Support**
- ✅ Claude Desktop
- ✅ Windsurf  
- ✅ Cursor
- ✅ VS Code + Cline
- ✅ Any MCP-compatible editor

## 📋 Configuration Reference

### **Option 1: NPX (Recommended for Local)**
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

### **Option 2: Hosted Service**
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

## 🎯 How to Call MCP in Each Editor

### Claude Desktop
Just ask naturally:
- "Search for React testing libraries"
- "Check if lodash has vulnerabilities"
- "What's the bundle size of moment?"

**How to know it's working:**
- Look for tool use blocks
- Structured output with real data
- Package versions and live stats

### Windsurf
Natural language works:
- "Install express and cors"
- "Show me latest typescript version"
- "Audit my dependencies"

**How to know it's working:**
- "AI is using tools" indicator
- Loading spinners with tool names
- Real-time results

### Cursor
Ask in chat/composer:
- "What packages are outdated?"
- "Compare axios vs fetch bundle size"
- "Find MIT licensed packages"

**How to know it's working:**
- Tool usage shown in sidebar
- "Using MCP server: npmplus-mcp"
- Execution time displayed

### VS Code + Cline
Use @ symbol:
- `@npmplus-mcp search for testing libraries`
- `@npmplus-mcp check bundle size of react`
- `@npmplus-mcp.audit_dependencies`

**How to know it's working:**
- @npmplus-mcp tag highlighted
- Output in Cline panel
- "Invoking MCP tool..." messages

## ✅ Quick Test Commands

Test if MCP is active:
```
// Simple test
"MCP status"
"@npmplus-mcp test"

// Functional test  
"What's the current version of React?"
"Search for a package called express"
```

## 🔍 MCP Usage Indicators

### ✅ MCP IS Working
- 📊 Real package data with versions
- 🔧 "Using tool: search_packages" messages
- ⚡ Live download stats & bundle sizes
- 🎯 Structured output with icons
- ⏱️ Execution time shown

### ❌ MCP NOT Working
- 📝 Generic suggestions only
- 🚫 "I would help you..." responses
- 📅 Outdated package info
- 💭 "Based on my knowledge..."
- 🔗 Links to npm website

## 📁 Configuration File Locations

| Editor | Config File | Location |
|--------|------------|----------|
| **Claude** | `claude_desktop_config.json` | `~/Library/Application Support/Claude/` (Mac)<br>`%APPDATA%\Claude\` (Windows) |
| **Windsurf** | `.windsurfrc` | Project root |
| **Cursor** | Settings or `.cursorrules` | VS Code settings or project root |
| **VS Code** | `settings.json` | `.vscode/` or user settings |
| **Cline** | `.cline/config.json` | Project root or `~/.cline/` |

## 🌐 Website Updates

The landing page (npmplus-website) now includes:
- **"What is MCP?"** section for newcomers
- **"How to Know MCP is Working"** guide
- **Usage examples** for each editor
- **NPX and Hosted** configuration tabs
- **Visual indicators** for MCP activity

## 🛠️ Available Tools

### Search & Discovery
- `search_packages` - Search npm registry
- `package_info` - Get package details

### Package Management
- `install_packages` - Install packages
- `update_packages` - Update packages
- `remove_packages` - Remove packages
- `check_outdated` - Find outdated

### Security & Analysis
- `audit_dependencies` - Security audit
- `check_vulnerability` - Check specific package
- `check_bundle_size` - Bundle size analysis
- `download_stats` - Download statistics

### Advanced (Local only)
- `dependency_tree` - Visualize dependencies
- `list_licenses` - License compliance
- `analyze_dependencies` - Circular deps

## 💡 Pro Tips

1. **Be explicit if needed:**
   - "Use NPM Plus to..."
   - "@npmplus-mcp ..."
   - "With the MCP tool..."

2. **Batch operations:**
   - "Install express and check its bundle size"
   - "Search for testing libs and show the most popular"

3. **Version-specific:**
   - "Check bundle size of react@18 vs react@17"
   - "Is express@4.17.1 vulnerable?"

4. **Comparisons:**
   - "Compare bundle sizes: moment vs dayjs"
   - "Which is more popular: express or fastify?"

## 🆘 Troubleshooting

### MCP not found
- Restart editor after config
- Check JSON syntax
- Ensure npm package is published

### No response
- Test: https://api.npmplus.dev/health
- Check internet for npx
- View editor logs/console

### Wrong results
- Verify you see tool indicators
- Try explicit invocation
- Check which version (hosted/local)

## 📚 Documentation

- **Setup Guides:**
  - [Windsurf Setup](docs/WINDSURF_SETUP.md)
  - [VS Code & Cline Setup](docs/VSCODE_CLINE_SETUP.md)
  - [MCP Reference](docs/MCP_REFERENCE.md)
  - [Usage Indicators](docs/MCP_USAGE_INDICATORS.md)

- **Configuration:**
  - [Configuration Summary](docs/CONFIGURATION_SUMMARY.md)
  - [Deployment Guide](docs/DEPLOYMENT.md)

## 🎉 Ready to Use!

NPM Plus MCP is now fully configured with:
- Consistent `npmplus-mcp` naming
- NPX installation support
- Full editor compatibility
- Clear usage indicators
- Comprehensive documentation

Ask your AI assistant to search for packages, check security, or analyze bundle sizes - and watch for the MCP indicators to confirm it's working!