/**
 * Application-wide constants for NPM Plus MCP Server.
 * Centralizes all configuration values, URLs, version information, and detection patterns.
 */

// ==================== VERSION AND PROTOCOL ====================

/**
 * Current application version used across all components.
 * @constant {string}
 */
export const VERSION = '12.0.6';

/**
 * MCP (Model Context Protocol) version supported by this server.
 * @constant {string}
 */
export const MCP_PROTOCOL_VERSION = '2024-11-05';

/**
 * Server name identifier for MCP protocol.
 * @constant {string}
 */
export const SERVER_NAME = 'npmplus-mcp';

// ==================== PACKAGE MANAGERS ====================

/**
 * Supported package managers with their command-line names.
 * @constant {Record<string, PackageManagerType>}
 */
export const PACKAGE_MANAGERS = Object.freeze({
  NPM: 'npm',
  YARN: 'yarn', 
  PNPM: 'pnpm',
} as const);

/**
 * Package manager lock file names for automatic detection.
 * Ordered by detection priority (most specific first).
 * @constant {Array<{manager: string, file: string}>}
 */
export const LOCK_FILES = [
  { manager: PACKAGE_MANAGERS.PNPM, file: 'pnpm-lock.yaml' },
  { manager: PACKAGE_MANAGERS.YARN, file: 'yarn.lock' },
  { manager: PACKAGE_MANAGERS.NPM, file: 'package-lock.json' },
] as const;

// ==================== EXTERNAL API URLS ====================

/**
 * External service URLs for package registry and analysis.
 * @constant {Record<string, string>}
 */
export const URLS = Object.freeze({
  // NPM Registry and API
  NPM_REGISTRY: 'https://registry.npmjs.org',
  NPM_API: 'https://api.npmjs.org',
  NPM_WEBSITE: 'https://www.npmjs.com',
  
  // Bundle analysis
  BUNDLEPHOBIA_API: 'https://bundlephobia.com/api',
  
  // Security databases
  GITHUB_ADVISORY_API: 'https://api.github.com/advisories',
  GITHUB_ADVISORIES_WEBSITE: 'https://github.com/advisories',
  OSV_API: 'https://api.osv.dev/v1',
  OSV_WEBSITE: 'https://osv.dev/vulnerability',
} as const);

// ==================== USER AGENT DETECTION ====================

/**
 * Editor detection patterns from User-Agent strings.
 * Each pattern maps to a standardized editor name.
 * @constant {Array<{pattern: string, name: string}>}
 */
export const EDITOR_PATTERNS = Object.freeze([
  { pattern: 'claude', name: 'claude' },
  { pattern: 'windsurf', name: 'windsurf' },
  { pattern: 'cursor', name: 'cursor' },
  { pattern: 'vscode', name: 'vscode' },
  { pattern: 'cline', name: 'cline' },
  { pattern: 'vs code', name: 'vscode' },
  { pattern: 'visual studio code', name: 'vscode' },
] as const);

// ==================== SECURITY CONSTANTS ====================

/**
 * Ecosystem identifier for npm packages in vulnerability databases.
 * @constant {string}
 */
export const NPM_ECOSYSTEM = 'npm';

// ==================== TIMEOUT CONFIGURATIONS ====================

/**
 * Timeout configurations for various operations in milliseconds.
 * @constant {Record<string, number>}
 */
export const DEFAULT_TIMEOUTS = {
  PACKAGE_MANAGER: 60000,  // 60 seconds for package manager operations
  HTTP_REQUEST: 30000,     // 30 seconds for HTTP requests
  RATE_LIMIT_RETRY: 1000,  // 1 second retry delay for rate limiting
} as const;

// ==================== CACHE CONFIGURATIONS ====================

/**
 * Cache settings for various caching scenarios.
 * @constant {Record<string, number>}
 */
export const CACHE_SETTINGS = {
  DEFAULT_TTL: 600,      // 10 minutes default TTL
  SHORT_TTL: 300,        // 5 minutes for volatile data
  LONG_TTL: 3600,        // 1 hour for stable data
  CHECK_PERIOD: 120,     // 2 minutes check period
  MAX_KEYS: 1000,        // Maximum number of cache keys
} as const;

// ==================== HTTP CONFIGURATIONS ====================

/**
 * HTTP server and client configurations.
 * @constant {Record<string, number | string>}
 */
export const HTTP_SETTINGS = {
  DEFAULT_PORT: 3000,
  RATE_LIMIT_CONCURRENT: 5,
  USER_AGENT: `mcp-package-manager/${VERSION}`,
} as const;

// ==================== SEARCH QUALITY WEIGHTS ====================

/**
 * Quality weights for package search scoring.
 * @constant {Record<string, number>}
 */
export const SEARCH_QUALITY_WEIGHTS = {
  QUALITY: 0.9,      // Quality score weight
  POPULARITY: 0.8,   // Popularity weight
  MAINTENANCE: 0.7,  // Maintenance score weight
} as const;

// ==================== RATE LIMITING ====================

/**
 * Rate limiting configurations.
 * @constant {Record<string, number>}
 */
export const RATE_LIMITING = {
  REQUESTS_PER_HOUR: 1000,
  WINDOW_MS: 60 * 60 * 1000,  // 1 hour in milliseconds
} as const;

// ==================== CORS HEADERS ====================

/**
 * Standard CORS headers for API responses.
 * @constant {Record<string, string>}
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Detects editor type from User-Agent string using predefined patterns.
 * 
 * @param userAgent - The User-Agent string to analyze
 * @returns The detected editor name or 'unknown' if no match found
 * 
 * @example
 * ```typescript
 * const editor = detectEditorFromUserAgent('Claude Desktop/1.0');
 * console.log(editor); // 'claude'
 * 
 * const unknown = detectEditorFromUserAgent('Custom Browser/1.0');
 * console.log(unknown); // 'unknown'
 * ```
 */
export function detectEditorFromUserAgent(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  for (const { pattern, name } of EDITOR_PATTERNS) {
    if (ua.includes(pattern)) {
      return name;
    }
  }
  
  return 'unknown';
}