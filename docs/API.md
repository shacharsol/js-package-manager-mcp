# NPM Plus API Documentation

## Overview

NPM Plus provides a comprehensive MCP (Model Context Protocol) server for JavaScript package management. This document describes all available tools and their usage.

## Base URL

**Hosted Service**: `https://api.npmplus.dev/mcp`

## Authentication

No authentication required. The service is free and open for public use.

## MCP Protocol

NPM Plus implements the [Model Context Protocol](https://modelcontextprotocol.io/) specification.

### Initialization

```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "your-client",
      "version": "1.0.0"
    }
  }
}
```

## Available Tools

### 🔍 Package Search & Information

#### `search_packages`

Search for packages in the npm registry with intelligent ranking.

**Schema:**
```typescript
{
  query: string;           // Search query (required)
  limit?: number;          // Max results (1-100, default: 25)
  from?: number;           // Pagination offset (default: 0)
}
```

**Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_packages",
    "arguments": {
      "query": "react testing",
      "limit": 10
    }
  }
}
```

#### `package_info`

Get detailed information about a specific package.

**Schema:**
```typescript
{
  packageName: string;     // Package name (required)
  version?: string;        // Specific version (optional)
}
```

### 📦 Package Management

#### `install_packages`

Install packages with various options.

**Schema:**
```typescript
{
  packages: string[];      // Package names with optional versions
  cwd?: string;           // Working directory
  dev?: boolean;          // Install as dev dependencies
  global?: boolean;       // Install globally
}
```

**Example:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "install_packages",
    "arguments": {
      "packages": ["react@^18.0.0", "typescript"],
      "dev": true
    }
  }
}
```

#### `update_packages`

Update packages to their latest versions.

**Schema:**
```typescript
{
  packages?: string[];     // Specific packages (optional, all if omitted)
  cwd?: string;           // Working directory
}
```

#### `remove_packages`

Remove packages from the project.

**Schema:**
```typescript
{
  packages: string[];      // Package names to remove
  cwd?: string;           // Working directory
  global?: boolean;       // Remove global packages
}
```

#### `check_outdated`

Check for outdated packages.

**Schema:**
```typescript
{
  cwd?: string;           // Working directory
  global?: boolean;       // Check global packages
}
```

### 🔒 Security & Auditing

#### `audit_dependencies`

Audit project dependencies for security vulnerabilities.

**Schema:**
```typescript
{
  cwd?: string;           // Working directory
  fix?: boolean;          // Attempt to fix vulnerabilities
  force?: boolean;        // Force fixes including breaking changes
  production?: boolean;   // Only audit production dependencies
}
```

#### `check_vulnerability`

Check a specific package for known vulnerabilities.

**Schema:**
```typescript
{
  packageName: string;     // Package name to check
  version?: string;        // Specific version
}
```

### 📊 Analysis & Insights

#### `dependency_tree`

Display the dependency tree of a project.

**Schema:**
```typescript
{
  cwd?: string;           // Working directory
  depth?: number;         // Maximum tree depth (0-10, default: 3)
  production?: boolean;   // Only show production dependencies
}
```

#### `check_bundle_size`

Analyze the bundle size impact of a package.

**Schema:**
```typescript
{
  packageName: string;     // Package name to analyze
  version?: string;        // Specific version
}
```

#### `analyze_dependencies`

Analyze project dependencies for issues like circular dependencies.

**Schema:**
```typescript
{
  cwd?: string;           // Working directory
  circular?: boolean;     // Check for circular dependencies
  orphans?: boolean;      // Check for orphaned files
}
```

#### `download_stats`

Get download statistics for a package.

**Schema:**
```typescript
{
  packageName: string;     // Package name
  period?: "last-day" | "last-week" | "last-month" | "last-year";
}
```

### 📜 License Management

#### `list_licenses`

List licenses of all dependencies.

**Schema:**
```typescript
{
  cwd?: string;           // Working directory
  production?: boolean;   // Only check production dependencies
  summary?: boolean;      // Show summary of license types
}
```

#### `check_license`

Check the license of a specific package.

**Schema:**
```typescript
{
  packageName: string;     // Package name
  version?: string;        // Specific version
}
```

### 🧹 Utilities

#### `clean_cache`

Clean the package manager cache.

**Schema:**
```typescript
{
  cwd?: string;           // Working directory
  global?: boolean;       // Clean global cache
}
```

## Error Handling

All tools return structured error responses:

```json
{
  "content": [{
    "type": "text",
    "text": "❌ Error: Package 'invalid-package-name' not found"
  }]
}
```

## Rate Limiting

The hosted service implements intelligent rate limiting:
- **Burst**: Up to 10 requests per second
- **Sustained**: 60 requests per minute
- **Daily**: 10,000 requests per day

## Caching

Responses are cached for optimal performance:
- **Package search**: 15 minutes
- **Package info**: 1 hour
- **Vulnerability data**: 6 hours
- **Download stats**: 24 hours

## Health Check

Monitor service health at: `https://api.npmplus.dev/health`

```json
{
  "status": "healthy",
  "service": "npm-plus-mcp-server",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```