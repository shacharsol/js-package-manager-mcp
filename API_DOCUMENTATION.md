# JavaScript Package Manager MCP Server - API Documentation

## Overview

The JavaScript Package Manager MCP Server (`npmplus-mcp-server`) is a production-ready Model Context Protocol (MCP) server that provides intelligent JavaScript package management capabilities. It supports npm, yarn, and pnpm package managers and integrates with AI editors like Claude, Windsurf, Cursor, and VS Code.

## Server Information

- **Name**: javascript-package-manager
- **Version**: 1.0.0
- **Protocol**: Model Context Protocol (MCP)
- **Transport**: STDIO (primary), HTTP/SSE (optional)

## HTTP Endpoints

When running as an HTTP server, the following endpoints are available:

### GET /
- **Description**: Server information and documentation page
- **Response**: HTML page with server status and configuration instructions
- **Content-Type**: text/html

### GET /health
- **Description**: Health check endpoint
- **Response**: JSON object with server status
- **Content-Type**: application/json
- **Response Schema**:
  ```json
  {
    "status": "healthy",
    "server": "javascript-package-manager", 
    "version": "1.0.0",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
  ```

### GET /mcp
- **Description**: MCP Server-Sent Events endpoint for HTTP transport
- **Protocol**: Server-Sent Events (SSE)
- **Usage**: Connect MCP clients via HTTP instead of STDIO

## MCP Tools

The server provides the following MCP tools organized by category:

### Search Tools

#### search_packages
- **Description**: Search for packages in the npm registry
- **Input Schema**:
  ```typescript
  {
    query: string;          // Search query string
    limit?: number;         // Maximum results (1-100, default: 25)
    from?: number;          // Pagination offset (default: 0)
  }
  ```
- **Features**:
  - Searches npm registry
  - Cached results (5 minutes)
  - Formatted output with package details
  - Pagination support

### Installation Tools

#### install_packages
- **Description**: Install npm packages in a project
- **Input Schema**:
  ```typescript
  {
    packages: string[];     // Array of package names (with optional versions)
    cwd?: string;          // Working directory (default: process.cwd())
    dev?: boolean;         // Install as dev dependencies (default: false)
    global?: boolean;      // Install globally (default: false)
  }
  ```
- **Features**:
  - Auto-detects package manager (npm/yarn/pnpm)
  - Supports dev and global installations
  - Version specification support

#### update_packages
- **Description**: Update packages to their latest versions
- **Input Schema**:
  ```typescript
  {
    packages?: string[];   // Specific packages to update (optional)
    cwd?: string;         // Working directory (default: process.cwd())
  }
  ```
- **Features**:
  - Updates all packages or specific ones
  - Works with all package managers

#### remove_packages
- **Description**: Remove packages from a project
- **Input Schema**:
  ```typescript
  {
    packages: string[];    // Array of package names to remove
    cwd?: string;         // Working directory (default: process.cwd())
    global?: boolean;     // Remove global packages (default: false)
  }
  ```

#### check_outdated
- **Description**: Check for outdated packages
- **Input Schema**:
  ```typescript
  {
    cwd?: string;         // Working directory (default: process.cwd())
    global?: boolean;     // Check global packages (default: false)
  }
  ```

### Security Tools

#### audit_dependencies
- **Description**: Audit project dependencies for vulnerabilities
- **Input Schema**:
  ```typescript
  {
    cwd?: string;         // Working directory (default: process.cwd())
    fix?: boolean;        // Attempt to fix vulnerabilities (default: false)
    force?: boolean;      // Force fixes including breaking changes (default: false)
    production?: boolean; // Only audit production dependencies (default: false)
  }
  ```
- **Features**:
  - Security vulnerability scanning
  - Auto-fix capabilities
  - Production-only auditing
  - Package manager specific commands

#### check_vulnerability
- **Description**: Check a specific package for known vulnerabilities
- **Input Schema**:
  ```typescript
  {
    packageName: string;  // Package name to check
    version?: string;     // Specific version (optional)
  }
  ```
- **Features**:
  - Cached results (1 hour)
  - Individual package vulnerability checks

### Analysis Tools

#### dependency_tree
- **Description**: Display the dependency tree of a project
- **Input Schema**:
  ```typescript
  {
    cwd?: string;         // Working directory (default: process.cwd())
    depth?: number;       // Maximum depth of tree (0-10, default: 3)
    production?: boolean; // Only show production dependencies (default: false)
  }
  ```

#### check_bundle_size
- **Description**: Check the bundle size of a package before installing
- **Input Schema**:
  ```typescript
  {
    packageName: string;  // Package name to analyze
    version?: string;     // Specific version (default: latest)
  }
  ```
- **Features**:
  - Bundlephobia integration
  - Cached results (1 hour)
  - Bundle size and install size analysis

#### analyze_dependencies
- **Description**: Analyze project dependencies for issues like circular dependencies
- **Input Schema**:
  ```typescript
  {
    cwd?: string;         // Working directory (default: process.cwd())
    circular?: boolean;   // Check for circular dependencies (default: true)
    orphans?: boolean;    // Check for orphaned files (default: true)
  }
  ```
- **Features**:
  - Circular dependency detection
  - Orphaned file detection
  - Uses madge for analysis

#### download_stats
- **Description**: Get download statistics for a package
- **Input Schema**:
  ```typescript
  {
    packageName: string;  // Package name
    period?: "last-day" | "last-week" | "last-month" | "last-year"; // Time period (default: "last-month")
  }
  ```

### Management Tools

#### list_licenses
- **Description**: List licenses of all dependencies in a project
- **Input Schema**:
  ```typescript
  {
    cwd?: string;         // Working directory (default: process.cwd())
    production?: boolean; // Only check production dependencies (default: false)
    summary?: boolean;    // Show summary of license types (default: true)
  }
  ```
- **Features**:
  - License compliance checking
  - Summary and detailed views
  - Local package.json parsing

#### check_license
- **Description**: Check the license of a specific package
- **Input Schema**:
  ```typescript
  {
    packageName: string;  // Package name to check
    version?: string;     // Specific version to check (optional)
  }
  ```

#### clean_cache
- **Description**: Clean the package manager cache
- **Input Schema**:
  ```typescript
  {
    cwd?: string;         // Working directory (default: process.cwd())
    global?: boolean;     // Clean global cache (default: false)
  }
  ```

#### package_info
- **Description**: Get detailed information about a package
- **Input Schema**:
  ```typescript
  {
    packageName: string;  // Package name
    version?: string;     // Specific version (optional)
  }
  ```

## Core Services

The server utilizes several core services:

### CacheManager
- **Purpose**: Caching for API responses and computed results
- **TTL**: Varies by data type (5 minutes to 1 hour)
- **Storage**: In-memory cache

### PackageManagerService
- **Purpose**: Auto-detection and interaction with package managers
- **Supported**: npm, yarn, pnpm
- **Features**: Command generation, version detection

### RegistryService
- **Purpose**: Interaction with npm registry and related APIs
- **APIs**: npm registry, bundlephobia, packagephobia

### SecurityService
- **Purpose**: Security scanning and vulnerability checking
- **Features**: Audit parsing, vulnerability reporting

### Analytics
- **Purpose**: Usage tracking and performance monitoring
- **Metrics**: Tool usage, response times, error rates

## Error Handling

All tools implement comprehensive error handling:

- **Validation**: Zod schema validation for all inputs
- **Execution**: Try-catch blocks with meaningful error messages
- **Response**: Structured error responses with `isError: true` flag
- **Logging**: Error tracking through analytics service

## Caching Strategy

The server implements intelligent caching:

- **Search Results**: 5 minutes TTL
- **Bundle Size**: 1 hour TTL
- **Vulnerabilities**: 1 hour TTL
- **Package Info**: Varies by data freshness requirements

## Package Manager Detection

Automatic detection based on:
1. Lock files (package-lock.json, yarn.lock, pnpm-lock.yaml)
2. Configuration files (.npmrc, .yarnrc, .pnpmrc)
3. Fallback to npm

## Usage Examples

### MCP Client Configuration
```json
{
  "mcpServers": {
    "javascript-package-manager": {
      "command": "npx",
      "args": ["npmplus-mcp-server"],
      "env": {}
    }
  }
}
```

### HTTP Server Usage
```bash
# Start HTTP server
node dist/http-index.js

# Health check
curl http://localhost:3000/health

# Connect MCP client to HTTP endpoint
# Use http://localhost:3000/mcp as the MCP endpoint
```

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm test
```

### Development Server
```bash
npm run dev
```

## Deployment

The server supports multiple deployment methods:
- **CLI Tool**: Via npm package
- **HTTP Server**: Standalone HTTP server
- **Netlify Functions**: Serverless deployment
- **Docker**: Container deployment (configuration available)

## Security Considerations

- Input validation using Zod schemas
- Command injection prevention
- Secure package manager execution
- Rate limiting through caching
- Error message sanitization

## Performance

- Efficient caching reduces API calls
- Concurrent execution where possible
- Memory-optimized dependency analysis
- Streaming responses for large outputs

---

*This documentation covers all available methods and endpoints in the JavaScript Package Manager MCP Server v1.0.0*
