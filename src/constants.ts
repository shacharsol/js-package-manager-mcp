/**
 * Application-wide constants for NPM Plus MCP Server.
 * Centralizes all configuration values, URLs, version information, and detection patterns.
 */

// ==================== VERSION AND PROTOCOL ====================

/**
 * Current application version used across all components.
 * @constant {string}
 */
export const VERSION = '1.0.0';

/**
 * MCP (Model Context Protocol) version supported by this server.
 * @constant {string}
 */
export const MCP_PROTOCOL_VERSION = '2024-11-05';

/**
 * Server name identifier for MCP protocol.
 * @constant {string}
 */
export const SERVER_NAME = 'javascript-package-manager';

// ==================== PACKAGE MANAGERS ====================

/**
 * Supported package managers with their command-line names.
 * @constant {Record<string, PackageManagerType>}
 */
export const PACKAGE_MANAGERS = {
  NPM: 'npm',
  YARN: 'yarn', 
  PNPM: 'pnpm',
} as const;

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
export const URLS = {
  // NPM Registry and API
  NPM_REGISTRY: 'https://registry.npmjs.org',
  NPM_API: 'https://api.npmjs.org',
  
  // Bundle analysis
  BUNDLEPHOBIA_API: 'https://bundlephobia.com/api',
  
  // Security databases
  GITHUB_ADVISORY_API: 'https://api.github.com/advisories',
  GITHUB_ADVISORIES_WEBSITE: 'https://github.com/advisories',
  OSV_API: 'https://api.osv.dev/v1',
  OSV_WEBSITE: 'https://osv.dev/vulnerability',
} as const;

// ==================== USER AGENT DETECTION ====================

/**
 * Editor detection patterns from User-Agent strings.
 * Each pattern maps to a standardized editor name.
 * @constant {Array<{pattern: string, name: string}>}
 */
export const EDITOR_PATTERNS = [
  { pattern: 'claude', name: 'claude' },
  { pattern: 'windsurf', name: 'windsurf' },
  { pattern: 'cursor', name: 'cursor' },
  { pattern: 'vscode', name: 'vscode' },
  { pattern: 'cline', name: 'cline' },
  { pattern: 'vs code', name: 'vscode' },
  { pattern: 'visual studio code', name: 'vscode' },
] as const;

// ==================== SECURITY CONSTANTS ====================

/**
 * Ecosystem identifier for npm packages in vulnerability databases.
 * @constant {string}
 */
export const NPM_ECOSYSTEM = 'npm';

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