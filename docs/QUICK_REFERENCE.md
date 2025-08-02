# NPM Plus MCP - Quick Reference Card

## 🎯 Cursor

### Setup (Choose One)
```json
// Option 1: Settings.json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "npx",
        "args": ["-y", "npmplus-mcp-server"]
      }
    }
  }
}

// Option 2: Hosted Service
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

### How to Use
```
// Natural Language (Auto-detect)
"Search for React form libraries"
"What's the bundle size of lodash?"
"Check for security vulnerabilities"

// Explicit Invocation
"Use npmplus-mcp to search for testing tools"
"With NPM Plus, analyze my dependencies"

// In Composer (Cmd+K)
"Find authentication packages using npmplus-mcp"
```

### Visual Indicators
- ✅ Tool sidebar shows "npmplus-mcp"
- ✅ "Using tool: search_packages" messages
- ✅ Real package data with versions
- ✅ Execution time displayed

## 🌊 Windsurf

### Setup (Choose One)
```json
// Option 1: .windsurfrc (Project Root)
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "npx",
        "args": ["-y", "npmplus-mcp-server"]
      }
    }
  }
}

// Option 2: Hosted Service
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

### How to Use
```
// Natural Language
"Install express and cors"
"Find React animation libraries"
"Update all outdated packages"

// Cascade Mode (Multi-step)
"Migrate from moment to dayjs and update all files"
"Optimize my bundle size by finding lighter alternatives"

// Direct Commands
"Show me the dependency tree"
"Audit dependencies for vulnerabilities"
```

### Visual Indicators
- ✅ "🔧 Using npmplus-mcp" in activity bar
- ✅ AI panel shows tool execution
- ✅ Progress indicators
- ✅ Structured tables and charts

## 🤖 Claude Desktop

### Setup
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "npmplus-mcp": {
      "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```

### How to Use
```
// Just ask naturally
"Search for testing libraries"
"What's the latest version of React?"
"Check bundle size of axios"
```

### Visual Indicators
- ✅ Tool use blocks in conversation
- ✅ Structured output with icons
- ✅ "Using search_packages..." messages

## 📝 VS Code + Cline

### Setup
```json
// VS Code settings.json
{
  "cline.mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  }
}
```

### How to Use
```
// Use @ symbol
@npmplus-mcp search for express middleware
@npmplus-mcp check bundle size of react
@npmplus-mcp.audit_dependencies

// Direct tool calls
@npmplus-mcp.search_packages query="testing"
@npmplus-mcp.package_info packageName="lodash"
```

### Visual Indicators
- ✅ @npmplus-mcp tag highlighted
- ✅ Output in Cline panel
- ✅ "Invoking MCP tool..." messages

## 🔧 Available Tools

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `search_packages` | Search npm registry | "Find React form libraries" |
| `package_info` | Get package details | "Info about express" |
| `install_packages` | Install packages | "Install typescript as dev" |
| `update_packages` | Update packages | "Update all packages" |
| `remove_packages` | Remove packages | "Remove unused-pkg" |
| `audit_dependencies` | Security audit | "Check for vulnerabilities" |
| `check_vulnerability` | Check specific pkg | "Is lodash@4.17.20 secure?" |
| `check_bundle_size` | Bundle analysis | "Size of moment vs dayjs" |
| `download_stats` | Popularity metrics | "Downloads for react" |
| `dependency_tree` | Dep visualization | "Show dependency tree" |
| `list_licenses` | License analysis | "Find MIT packages" |
| `check_outdated` | Find outdated | "What needs updating?" |

## 💡 Pro Tips

### 1. **Test Connection**
```
// Any editor
"Test npmplus-mcp"
"Is MCP working?"
"List available tools"
```

### 2. **Explicit When Needed**
```
// If not auto-detected
Cursor/Windsurf: "Use NPM Plus to..."
Cline: "@npmplus-mcp ..."
Claude: Usually auto-detects
```

### 3. **Complex Queries**
```
"Find the 5 most popular React component libraries, compare their bundle sizes, and check for security issues"

"What's the total size of all my dependencies vs devDependencies?"

"Find all packages that haven't been updated in over a year"
```

## 🚨 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP not found | Restart editor |
| No tool usage | Try explicit invocation |
| Timeout errors | Switch to hosted service |
| Wrong results | Check MCP indicators |

## 🔗 Config File Locations

- **Cursor**: Settings or `.cursorrules`
- **Windsurf**: `.windsurfrc` in project
- **Claude**: `~/Library/Application Support/Claude/`
- **VS Code**: `.vscode/settings.json`

---

**Remember**: Look for the visual indicators to confirm MCP is working!