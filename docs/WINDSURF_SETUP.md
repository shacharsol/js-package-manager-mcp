# Windsurf Setup Guide for NPM Plus

This guide helps you set up NPM Plus MCP integration with Windsurf IDE.

## Option 1: Hosted Service (Recommended)

The easiest way to get started is using our hosted service.

### Step 1: Copy Configuration

Copy the `.windsurfrc.hosted` file to `.windsurfrc` in your project root:

```bash
cp .windsurfrc.hosted .windsurfrc
```

**Or create `.windsurfrc` manually:**

```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "transport": "http",
        "url": "https://api.npmplus.dev/mcp",
        "description": "NPM Plus - JavaScript package management via hosted service"
      }
    }
  }
}
```

### Step 2: Test the Integration

1. Restart Windsurf
2. Open a JavaScript/TypeScript project
3. Ask Windsurf: **"Search for React testing libraries"**

You should see MCP tools being used to search the npm registry.

## Option 2: Local Development

For development or customization, you can run NPM Plus locally.

### Step 1: Build the Project

```bash
npm install
npm run build
```

### Step 2: Use Local Configuration

The default `.windsurfrc` is already configured for local development:

```json
{
  "mcp": {
    "servers": {
      "npmplus-mcp": {
        "command": "node",
        "args": ["./dist/index.js"],
        "cwd": "./",
        "description": "NPM Plus - JavaScript package management with NPM, Yarn, and pnpm support"
      }
    }
  }
}
```

### Step 3: Test Local Setup

1. Restart Windsurf
2. Ask: **"Install express and cors packages"**

## Available Actions in Windsurf

Once configured, you can use these natural language commands:

### Package Search
- "Search for React form validation libraries"
- "Find alternatives to moment.js"
- "Show me React testing utilities"

### Package Information
- "What's the latest version of express?"
- "Show me information about lodash"
- "Get details for @types/node"

### Security Analysis
- "Check if lodash has any security vulnerabilities"
- "Audit my dependencies for security issues"
- "Is express safe to use?"

### Performance Analysis
- "What's the bundle size of lodash?"
- "How big is the moment.js package?"
- "Check bundle size impact of adding axios"

### Package Management (Local only)
- "Install typescript as a dev dependency" 
- "Update all my packages"
- "Remove unused packages"

## Troubleshooting

### Configuration Not Working

1. **Check file location**: `.windsurfrc` should be in your project root
2. **Restart Windsurf**: Changes require a restart
3. **Check JSON syntax**: Validate your `.windsurfrc` file

### Hosted Service Issues

1. **Check connectivity**: Ensure you can reach https://api.npmplus.dev/health
2. **Check URL**: Make sure you're using the correct endpoint

### Local Development Issues

1. **Build the project**: Run `npm run build` first
2. **Check paths**: Ensure `./dist/index.js` exists
3. **Node version**: Requires Node.js 16+

### Still Not Working?

1. Check Windsurf logs/console for errors
2. Verify the MCP server is responding:
   ```bash
   curl -X POST https://api.npmplus.dev/mcp \
     -H "Content-Type: application/json" \
     -d '{"method":"initialize","params":{}}'
   ```

## Best Practices

1. **Use hosted service** for most development work
2. **Switch to local** only when customizing or contributing
3. **Restart Windsurf** after configuration changes
4. **Use natural language** - Windsurf understands intent well

## Example Workflow

```
You: "I need to add form validation to my React app"

Windsurf: [Uses NPM Plus to search for React form libraries]
"I found several popular React form validation libraries..."

You: "Install react-hook-form and yup"

Windsurf: [Uses NPM Plus to install packages]
"Installing react-hook-form and yup..."
```

The integration makes package management feel natural and AI-powered!