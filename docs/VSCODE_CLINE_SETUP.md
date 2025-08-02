# VS Code + Cline Setup Guide for NPM Plus

This guide shows how to set up NPM Plus MCP with VS Code and Cline, and how to explicitly call MCP tools.

## 🆚 VS Code Setup

### Option 1: Using Cline Extension (Recommended)

1. **Install Cline Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Cline" by saoudrizwan
   - Install the extension

2. **Configure MCP in VS Code Settings**

   **Method A: Via Settings UI**
   - Press `Ctrl+,` (or `Cmd+,` on Mac)
   - Search for "cline mcp"
   - Add your MCP configuration

   **Method B: Edit settings.json**
   - Press `Ctrl+Shift+P` → "Open User Settings (JSON)"
   - Add this configuration:

   ```json
   {
     "cline.mcpServers": {
       "npmplus-mcp": {
         "command": "npx",
         "args": ["-y", "npmplus-mcp-server"]
       }
     }
   }
   ```

   **Alternative: Hosted Service**
   ```json
   {
     "cline.mcpServers": {
       "npmplus-mcp": {
         "transport": "http",
         "url": "https://api.npmplus.dev/mcp"
       }
     }
   }
   ```

### Option 2: Using Continue Extension

1. **Install Continue Extension**
   - Search for "Continue" in VS Code extensions
   - Install and configure

2. **Add to Continue Config**
   - Open Continue settings
   - Add MCP configuration:

   ```json
   {
     "models": [...],
     "mcpServers": {
       "npmplus-mcp": {
         "command": "npx",
         "args": ["-y", "npmplus-mcp-server"]
       }
     }
   }
   ```

## 🧬 Cline-Specific Configuration

### Project-Level Configuration

Create `.cline/config.json` in your project root:

```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Global Cline Configuration

**Location:**
- **Windows**: `%USERPROFILE%\.cline\config.json`
- **macOS/Linux**: `~/.cline/config.json`

```json
{
  "mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  },
  "defaultPrompts": {
    "packageSearch": "Use NPM Plus to search for packages",
    "securityAudit": "Use NPM Plus to audit dependencies"
  }
}
```

## 🎯 How to Explicitly Call MCP Tools

### In Cline Chat

Use the `@` symbol to reference MCP tools:

```
@npmplus-mcp search for React testing libraries

@npmplus-mcp check bundle size of lodash

@npmplus-mcp audit my dependencies for security issues
```

### Direct Tool Invocation

You can also use specific tool names:

```
@npmplus-mcp.search_packages query="react testing" limit=10

@npmplus-mcp.package_info packageName="express"

@npmplus-mcp.check_bundle_size packageName="moment"

@npmplus-mcp.audit_dependencies
```

### VS Code Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Cline: Run MCP Tool`
3. Select `npmplus-mcp`
4. Choose the tool you want to run

## 📝 Available MCP Tools Reference

### Search & Discovery
- `search_packages` - Search npm registry
- `package_info` - Get package details

### Package Management
- `install_packages` - Install packages
- `update_packages` - Update packages
- `remove_packages` - Remove packages
- `check_outdated` - Find outdated packages

### Security
- `audit_dependencies` - Security audit
- `check_vulnerability` - Check specific package

### Analysis
- `check_bundle_size` - Bundle size analysis
- `download_stats` - Download statistics
- `dependency_tree` - Visualize dependencies
- `analyze_dependencies` - Find circular deps

### License Management
- `list_licenses` - List all licenses
- `check_license` - Check specific license

## 💬 Example Conversations

### Basic Package Search
```
You: @npmplus-mcp search for express middleware packages

Cline: I'll search for Express middleware packages using NPM Plus.

[Uses search_packages tool]

Here are the top Express middleware packages:
1. body-parser - Parse incoming request bodies
2. cors - Enable CORS with various options
3. helmet - Help secure Express apps
...
```

### Security Audit
```
You: @npmplus-mcp can you audit my project for vulnerabilities?

Cline: I'll run a security audit on your dependencies.

[Uses audit_dependencies tool]

Security Audit Results:
- 3 vulnerabilities found
- 2 high severity, 1 moderate
- Run 'npm audit fix' to resolve
```

### Bundle Size Check
```
You: @npmplus-mcp what's the size difference between moment and dayjs?

Cline: I'll check the bundle sizes for both packages.

[Uses check_bundle_size tool for both]

Bundle Size Comparison:
- moment: 67.9kB minified + gzipped
- dayjs: 2.7kB minified + gzipped
- dayjs is 96% smaller!
```

## 🛠️ Workspace Settings

For project-specific configuration, create `.vscode/settings.json`:

```json
{
  "cline.mcpServers": {
    "npmplus-mcp": {
      "command": "npx",
      "args": ["-y", "npmplus-mcp-server"]
    }
  },
  "cline.customInstructions": "Always use @npmplus-mcp for package management tasks"
}
```

## 🔧 Troubleshooting

### MCP Not Available in Cline

1. **Check Cline version** - Update to latest
2. **Restart VS Code** after configuration
3. **Verify settings** - Check settings.json syntax

### Tools Not Working

1. **Test connection**:
   ```
   @npmplus-mcp test connection
   ```

2. **Check logs**:
   - View → Output → Select "Cline" from dropdown

3. **Verify npx works**:
   ```bash
   npx -y npmplus-mcp-server --version
   ```

### Performance Issues

- Use hosted service for better performance:
  ```json
  {
    "cline.mcpServers": {
      "npmplus-mcp": {
        "transport": "http",
        "url": "https://api.npmplus.dev/mcp"
      }
    }
  }
  ```

## 🌟 Pro Tips

1. **Create Snippets** for common tasks:
   ```json
   {
     "Search NPM": {
       "prefix": "npm-search",
       "body": "@npmplus-mcp search for ${1:package-name}"
     }
   }
   ```

2. **Use in Terminal**: Cline can execute commands:
   ```
   @npmplus-mcp install express cors helmet
   ```

3. **Combine with Tasks**: Create VS Code tasks:
   ```json
   {
     "label": "Audit Dependencies",
     "type": "shell",
     "command": "echo '@npmplus-mcp audit_dependencies' | cline"
   }
   ```

## 📚 Additional Resources

- [Cline Documentation](https://github.com/saoudrizwan/claude-dev)
- [VS Code MCP Extensions](https://marketplace.visualstudio.com/search?term=mcp)
- [NPM Plus GitHub](https://github.com/shacharsol/js-package-manager-mcp)