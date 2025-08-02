# NPM Plus MCP - Quick Reference

## 🎯 How to Call MCP in Each Editor

### Claude Desktop
```
Just ask naturally:
"Search for React testing libraries"
"Check if lodash has vulnerabilities"
"What's the bundle size of moment.js?"

Claude automatically uses the MCP tools.
```

### Windsurf
```
Natural language:
"Install express and cors packages"
"Show me the latest version of typescript"
"Audit my dependencies for security issues"

Windsurf detects intent and uses MCP.
```

### Cursor
```
In chat or composer:
"Search npm for authentication packages"
"Check bundle size of lodash"
"Update all outdated packages"

Cursor will use the configured MCP.
```

### VS Code + Cline
```
Use @ symbol:
@npmplus-mcp search for React form libraries
@npmplus-mcp check bundle size of axios
@npmplus-mcp audit dependencies

Or direct tools:
@npmplus-mcp.search_packages query="react testing"
@npmplus-mcp.package_info packageName="express"
```

## 📋 Complete Tool Reference

### 🔍 Search & Discovery

**search_packages**
```typescript
// Claude/Windsurf/Cursor
"Search for React animation libraries"
"Find packages for JWT authentication"
"Show me popular testing frameworks"

// Cline
@npmplus-mcp search for animation libraries
@npmplus-mcp.search_packages query="react animation" limit=20
```

**package_info**
```typescript
// Claude/Windsurf/Cursor
"Show me details about express"
"What's the latest version of lodash?"
"Get info about @types/node"

// Cline
@npmplus-mcp get info about express
@npmplus-mcp.package_info packageName="lodash" version="4.17.21"
```

### 📦 Package Management

**install_packages**
```typescript
// Claude/Windsurf/Cursor
"Install express, cors, and helmet"
"Add typescript as a dev dependency"
"Install axios globally"

// Cline
@npmplus-mcp install express cors helmet
@npmplus-mcp.install_packages packages=["typescript"] dev=true
```

**update_packages**
```typescript
// Claude/Windsurf/Cursor
"Update all packages to latest"
"Update only React to latest version"
"Update all dev dependencies"

// Cline
@npmplus-mcp update all packages
@npmplus-mcp.update_packages packages=["react", "react-dom"]
```

**remove_packages**
```typescript
// Claude/Windsurf/Cursor
"Remove unused-package"
"Uninstall global typescript"
"Remove lodash and moment"

// Cline
@npmplus-mcp remove lodash moment
@npmplus-mcp.remove_packages packages=["unused-pkg"] global=true
```

### 🔒 Security Tools

**audit_dependencies**
```typescript
// Claude/Windsurf/Cursor
"Audit my dependencies for vulnerabilities"
"Check for security issues and fix them"
"Run security audit"

// Cline
@npmplus-mcp audit dependencies
@npmplus-mcp.audit_dependencies fix=true
```

**check_vulnerability**
```typescript
// Claude/Windsurf/Cursor
"Check if express has any vulnerabilities"
"Is lodash@4.17.20 secure?"
"Check security of react@17"

// Cline
@npmplus-mcp check vulnerability of express
@npmplus-mcp.check_vulnerability packageName="lodash" version="4.17.20"
```

### 📊 Analysis Tools

**check_bundle_size**
```typescript
// Claude/Windsurf/Cursor
"What's the bundle size of moment vs dayjs?"
"Check size impact of adding lodash"
"How big is the react package?"

// Cline
@npmplus-mcp check bundle size of moment
@npmplus-mcp.check_bundle_size packageName="dayjs"
```

**download_stats**
```typescript
// Claude/Windsurf/Cursor
"Show download stats for express"
"How popular is React?"
"Get weekly downloads for axios"

// Cline
@npmplus-mcp show download stats for express
@npmplus-mcp.download_stats packageName="react" period="last-week"
```

**dependency_tree**
```typescript
// Claude/Windsurf/Cursor
"Show dependency tree for this project"
"Visualize dependencies of express"
"What does lodash depend on?"

// Cline
@npmplus-mcp show dependency tree
@npmplus-mcp.dependency_tree packageName="express"
```

### 📜 License & Utility

**list_licenses**
```typescript
// Claude/Windsurf/Cursor
"List all licenses in my project"
"Show me MIT licensed packages"
"Find packages with GPL license"

// Cline
@npmplus-mcp list all licenses
@npmplus-mcp.list_licenses filter="MIT"
```

**check_outdated**
```typescript
// Claude/Windsurf/Cursor
"Show outdated packages"
"Which packages need updates?"
"Check for available updates"

// Cline
@npmplus-mcp check outdated packages
@npmplus-mcp.check_outdated
```

## 🚀 Pro Tips

### 1. **Batch Operations**
```
// Multiple operations at once
"Install express and cors, then check their bundle sizes"
"Search for testing libraries and show me the most popular one's details"
```

### 2. **Specific Versions**
```
// Version-specific queries
"Check bundle size of react@18 vs react@17"
"Is express@4.17.1 vulnerable?"
"Install typescript@5.0.0 as dev dependency"
```

### 3. **Comparison Queries**
```
// Compare packages
"Compare bundle sizes: moment vs dayjs vs date-fns"
"Which is more popular: express or fastify?"
"Security comparison of bcrypt vs bcryptjs"
```

### 4. **Context-Aware**
```
// MCP understands context
"Update all packages" (updates in current directory)
"Install in the frontend folder" (respects cwd)
"Audit production dependencies only"
```

## 🔧 Configuration Locations

| Editor | Config File | Location |
|--------|------------|----------|
| Claude | `claude_desktop_config.json` | `~/Library/Application Support/Claude/` (Mac) |
| Windsurf | `.windsurfrc` | Project root |
| Cursor | Settings or `.cursorrules` | VS Code settings or project root |
| VS Code | `settings.json` | `.vscode/` or user settings |
| Cline | `.cline/config.json` | Project root or `~/.cline/` |

## 🆘 Common Issues

### "MCP not found"
- Restart your editor after configuration
- Check JSON syntax in config files
- Ensure npmplus-mcp-server is published to npm

### "Tool not available"
- Verify MCP is configured correctly
- Check if using hosted vs local version
- Some tools only work with local installation

### "No response from MCP"
- Test hosted service: https://api.npmplus.dev/health
- For npx: ensure internet connection
- Check editor's output/console for errors