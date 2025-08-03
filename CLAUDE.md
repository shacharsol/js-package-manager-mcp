# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for comprehensive JavaScript package management across NPM, Yarn, and pnpm. The server provides AI assistants with tools to search, install, analyze, and manage JavaScript dependencies with security and performance analysis capabilities.

## Development Commands

### Core Commands
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev` - Run in development mode with hot reload using tsx
- `npm test` - Run Jest tests
- `npm run clean` - Remove build artifacts from dist/
- `npm start` - Run the compiled server from dist/index.js

### Testing
- Tests are configured with Jest and ts-jest for TypeScript support
- Test files: `**/__tests__/**/*.ts` and `**/?(*.)+(spec|test).ts`
- Coverage reports generated in coverage/ directory

## Architecture

### Entry Point & Server Structure
- **Main entry**: `src/index.ts` - Sets up MCP server with stdio transport and graceful shutdown
- **Server configuration**: `src/server.ts` - Unified MCP server with modular tool system
- **Package manager detection**: `src/pm-detect.ts` - Auto-detects npm/yarn/pnpm based on lock files
- **Caching system**: `src/cache.ts` - Memory cache with TTL for API responses

### Tool Organization
The server uses a modular tool architecture where tools are organized by functionality:

- **Search Tools**: Package registry search and metadata retrieval
- **Install Tools**: Package installation, updates, and removal
- **Security Tools**: Vulnerability auditing and security analysis  
- **Analysis Tools**: Bundle size analysis, dependency trees, circular dependency detection
- **Management Tools**: License checking, cache management, package information

Each tool module exports:
```typescript
export const tools = [/* tool definitions */];
export const handlers = new Map([/* tool handlers */]);
```

### Key Technical Details
- **TypeScript**: ES2022 target with ESNext modules and strict mode
- **MCP SDK**: Uses `@modelcontextprotocol/sdk` for protocol implementation
- **Process Execution**: Uses `execa` for secure package manager command execution
- **Validation**: Zod schemas for input validation on all tools
- **HTTP Client**: Custom HTTP client for npm registry and bundle analysis APIs
- **Caching**: Node-cache with TTL for API responses to reduce external calls
- **Package Manager Agnostic**: Automatically detects and works with npm, yarn, or pnpm

### File Structure Patterns
- `src/tools/` - Modular tool implementations  
- `src/` - Core utilities (http-client, cache, pm-detect)
- `example/` - Example files for testing and demonstration
- Tool modules follow consistent pattern of schema definitions, tool exports, and handler implementations

### Caching Architecture
The `cache.ts` module provides a centralized caching system:
- Uses NodeCache with 5-minute default TTL
- Organized cache key generators for consistency
- Supports package info, search results, vulnerabilities, bundle sizes, and downloads
- Automatic cleanup of expired entries

## MCP Configuration

### Hosted Service (Recommended)
The easiest way to use this MCP server is through our hosted service at npmplus.dev:

```json
{
  "mcpServers": {
    "javascript-package-manager": {
      "transport": "http",
      "url": "https://api.npmplus.dev/mcp"
    }
  }
}
```

### Netlify Deployment
Deploy your own instance:
- `npm run build:netlify` - Build for Netlify
- `npm run deploy:netlify` - Deploy to Netlify
- One-click deploy button available in README

### Local Setup
For local development or private deployments:

#### Multi-Editor Support
This project includes configuration files for multiple editors:

- **Windsurf**: `.windsurfrc`
- **VS Code**: `.vscode/settings.json`
- **Cursor**: `.cursorrules`
- **Universal**: `mcp-config.json`

#### Quick Setup
Run the automated setup script:
```bash
./setup-mcp.sh
```

### Claude Desktop Configuration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
```json
{
  "mcpServers": {
    "javascript-package-manager": {
      "command": "node",
      "args": ["/path/to/js-package-manager-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### Available Tool Categories
- **search_packages** - npm registry search with pagination
- **install_packages/update_packages/remove_packages** - Package lifecycle management
- **audit_dependencies/check_vulnerability** - Security analysis
- **dependency_tree/analyze_dependencies** - Dependency analysis and visualization
- **check_bundle_size/download_stats** - Performance metrics
- **list_licenses/clean_cache/package_info** - Utility functions

## Development Notes

### Package Manager Detection Logic
The system automatically detects package managers in this order:
1. Lock files (pnpm-lock.yaml → yarn.lock → package-lock.json)
2. Config files (.npmrc, .yarnrc.yml)  
3. package.json packageManager field
4. Defaults to npm

### Security & Performance Features
- All package manager commands executed in isolated processes with execa
- Input validation prevents command injection via Zod schemas
- Response caching with configurable TTL to reduce API calls
- Rate limiting for external API requests
- Integration with bundlephobia and packagephobia for size analysis