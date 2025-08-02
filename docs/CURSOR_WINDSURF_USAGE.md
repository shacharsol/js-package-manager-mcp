# NPM Plus MCP - Cursor & Windsurf Usage Guide

## 🎯 Cursor Usage

### Configuration Options

**Option 1: Via Cursor Settings (Recommended)**
1. Open Cursor Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "MCP" 
3. Add configuration:

```json
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
```

**Option 2: Via .cursorrules file**
Create `.cursorrules` in project root:
```
# NPM Plus MCP Integration
This project uses NPM Plus MCP for package management.
MCP server: npmplus-mcp
Available at: https://api.npmplus.dev/mcp

When I ask about packages, use the npmplus-mcp tools:
- search_packages for finding packages
- package_info for package details
- check_bundle_size for size analysis
- audit_dependencies for security checks
```

### How to Use in Cursor

#### 1. **Natural Language (Auto-detection)**
Cursor will automatically use MCP when it detects package-related queries:
```
"Search for React animation libraries"
"What's the bundle size of lodash?"
"Check if express has vulnerabilities"
"Install typescript as dev dependency"
```

#### 2. **Explicit MCP Invocation**
To ensure MCP is used:
```
"Use npmplus-mcp to search for testing frameworks"
"With the MCP server, check bundle size of moment"
"Using NPM Plus, audit my dependencies"
```

#### 3. **In Composer (Cmd+K)**
```
# In the composer window:
Search npm for authentication packages using npmplus-mcp
Check security vulnerabilities with NPM Plus
Compare bundle sizes: axios vs fetch
```

### How to Know MCP is Active in Cursor

**Look for these indicators:**

1. **Tool Usage Sidebar**
   - Shows "npmplus-mcp" when active
   - Lists tool names being used
   - Displays execution time

2. **Chat Response Format**
   ```
   I'll search for React animation libraries using NPM Plus.
   
   [Using npmplus-mcp.search_packages]
   
   Found 156 results:
   1. framer-motion (v10.16.5)
   2. react-spring (v9.7.3)
   ...
   ```

3. **Structured Output**
   - Real package versions
   - Download counts
   - Bundle sizes with units
   - Security vulnerability details

### Cursor-Specific Features

**1. Apply Code Changes**
```
"Install the packages we just searched for"
→ Cursor can apply npm install commands directly
```

**2. Multi-file Context**
```
"Check all package.json files in this monorepo for vulnerabilities"
→ Cursor understands workspace context
```

**3. Inline Suggestions**
```
// When typing: import ... from '
Cursor can suggest packages based on MCP search
```

## 🌊 Windsurf Usage

### Configuration

**Option 1: Project-level .windsurfrc**
```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "npx",
        "args": ["-y", "npmplus-mcp-server"],
        "disabled": false
      }
    }
  }
}
```

**Option 2: Global Configuration**
Place in `~/.windsurf/config.json`:
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

### How to Use in Windsurf

#### 1. **Natural Language Commands**
Windsurf has excellent intent detection:
```
"I need to add authentication to my Express app"
→ Searches for auth packages automatically

"Set up testing for my React components"
→ Finds and suggests testing libraries

"My bundle is too large, help me optimize"
→ Analyzes current dependencies and suggests alternatives
```

#### 2. **Direct Commands**
```
"Search npm for JWT libraries"
"Install express, cors, and helmet"
"Show me the dependency tree"
"Audit all dependencies for security issues"
```

#### 3. **Cascade Mode (Windsurf-specific)**
```
"Update all my packages to latest versions and fix any breaking changes"
→ Windsurf will:
  1. Check outdated packages
  2. Update them
  3. Run tests
  4. Fix any issues
```

### How to Know MCP is Active in Windsurf

**Visual Indicators:**

1. **Activity Bar**
   - Shows "🔧 Using npmplus-mcp"
   - Progress indicator during execution
   - Tool names appear in status

2. **AI Panel**
   ```
   🤖 AI is using tools...
   └─ npmplus-mcp.search_packages
   └─ npmplus-mcp.check_bundle_size
   ```

3. **Results Format**
   - Tables for package comparisons
   - Charts for bundle sizes
   - Tree view for dependencies

### Windsurf-Specific Features

**1. Multi-step Workflows**
```
"Migrate from moment to dayjs"
→ Windsurf will:
  - Check current usage
  - Install dayjs
  - Update imports
  - Remove moment
  - Verify no breaks
```

**2. Smart Context**
```
"Find a lighter alternative to this package"
→ Windsurf knows which package from cursor position
```

**3. Side-by-side Comparison**
```
"Compare these authentication libraries"
→ Opens comparison view with bundle sizes, features, popularity
```

## 🎮 Advanced Usage

### Cursor Advanced

**1. Custom Commands**
Create custom Cursor commands that use MCP:
```json
{
  "commands": {
    "npm-security": "Use npmplus-mcp to audit all dependencies",
    "npm-optimize": "Find and suggest lighter alternatives for large packages"
  }
}
```

**2. Keyboard Shortcuts**
```json
{
  "keybindings": [
    {
      "key": "cmd+shift+p",
      "command": "npm-search",
      "when": "editorTextFocus"
    }
  ]
}
```

### Windsurf Advanced

**1. Workflow Automation**
Create `.windsurf/workflows/npm-check.yml`:
```yaml
name: Weekly NPM Check
trigger: schedule
schedule: "0 9 * * MON"
steps:
  - uses: npmplus-mcp
    with:
      action: audit_dependencies
  - uses: npmplus-mcp  
    with:
      action: check_outdated
```

**2. Git Hooks Integration**
```bash
# .windsurf/hooks/pre-commit
windsurf run "Use npmplus-mcp to check for security vulnerabilities"
```

## 🔍 Comparison: Cursor vs Windsurf

| Feature | Cursor | Windsurf |
|---------|--------|----------|
| **MCP Invocation** | Natural language + composer | Natural language + cascade |
| **Visual Feedback** | Sidebar + inline | Activity bar + AI panel |
| **Best For** | Quick edits, code generation | Multi-step workflows |
| **Unique Feature** | Apply changes directly | Cascade mode automation |
| **Context Awareness** | Current file/selection | Entire project context |

## 💡 Tips for Both Editors

### 1. **Be Specific When Needed**
```
// If MCP isn't triggered automatically:
Cursor: "Using npmplus-mcp, search for..."
Windsurf: "With NPM Plus, find..."
```

### 2. **Use for Complex Tasks**
```
"Analyze why my bundle is 2MB and suggest optimizations"
"Find all GPL licensed dependencies and suggest MIT alternatives"
"Create a security report for all dependencies"
```

### 3. **Combine with Editor Features**
```
Cursor: Use with multi-cursor editing
Windsurf: Use with cascade mode for migrations
```

## 🚀 Quick Start Commands

### First-time Setup Test
```
// Cursor
"Test npmplus-mcp connection"
"What tools does NPM Plus provide?"

// Windsurf  
"Check if NPM Plus MCP is working"
"List available npm tools"
```

### Daily Usage
```
// Both editors understand:
"What's new in React 18?"
"Is there a lighter alternative to moment.js?"
"Show me the most popular testing frameworks"
"Check my project for security vulnerabilities"
```

## 🆘 Troubleshooting

### Cursor Issues
1. **MCP not showing**: Check Settings → Extensions → MCP
2. **No tool usage**: Try explicit invocation
3. **Restart**: Cmd+Shift+P → "Reload Window"

### Windsurf Issues
1. **Not detecting MCP**: Check .windsurfrc location
2. **Slow response**: Switch to hosted service
3. **Restart**: Close and reopen Windsurf

### Both Editors
- Check for conflicting MCP servers
- Ensure only one npmplus-mcp config
- Look for errors in developer console
- Try both npx and hosted versions

## 📚 More Resources

- [General MCP Reference](./MCP_REFERENCE.md)
- [Configuration Guide](./CONFIGURATION_SUMMARY.md)
- [VS Code + Cline Setup](./VSCODE_CLINE_SETUP.md)
- [MCP Usage Indicators](./MCP_USAGE_INDICATORS.md)