/**
 * Application-wide constants for NPM Plus MCP Server.
 * Centralizes all configuration values, URLs, version information, and detection patterns.
 */
/**
 * Current application version used across all components.
 * @constant {string}
 */
export declare const VERSION = "5.0.0";
/**
 * MCP (Model Context Protocol) version supported by this server.
 * @constant {string}
 */
export declare const MCP_PROTOCOL_VERSION = "2024-11-05";
/**
 * Server name identifier for MCP protocol.
 * @constant {string}
 */
export declare const SERVER_NAME = "npmplus-mcp";
/**
 * Supported package managers with their command-line names.
 * @constant {Record<string, PackageManagerType>}
 */
export declare const PACKAGE_MANAGERS: Readonly<{
    readonly NPM: "npm";
    readonly YARN: "yarn";
    readonly PNPM: "pnpm";
}>;
/**
 * Package manager lock file names for automatic detection.
 * Ordered by detection priority (most specific first).
 * @constant {Array<{manager: string, file: string}>}
 */
export declare const LOCK_FILES: readonly [{
    readonly manager: "pnpm";
    readonly file: "pnpm-lock.yaml";
}, {
    readonly manager: "yarn";
    readonly file: "yarn.lock";
}, {
    readonly manager: "npm";
    readonly file: "package-lock.json";
}];
/**
 * External service URLs for package registry and analysis.
 * @constant {Record<string, string>}
 */
export declare const URLS: Readonly<{
    readonly NPM_REGISTRY: "https://registry.npmjs.org";
    readonly NPM_API: "https://api.npmjs.org";
    readonly NPM_WEBSITE: "https://www.npmjs.com";
    readonly BUNDLEPHOBIA_API: "https://bundlephobia.com/api";
    readonly GITHUB_ADVISORY_API: "https://api.github.com/advisories";
    readonly GITHUB_ADVISORIES_WEBSITE: "https://github.com/advisories";
    readonly OSV_API: "https://api.osv.dev/v1";
    readonly OSV_WEBSITE: "https://osv.dev/vulnerability";
}>;
/**
 * Editor detection patterns from User-Agent strings.
 * Each pattern maps to a standardized editor name.
 * @constant {Array<{pattern: string, name: string}>}
 */
export declare const EDITOR_PATTERNS: readonly [{
    readonly pattern: "claude";
    readonly name: "claude";
}, {
    readonly pattern: "windsurf";
    readonly name: "windsurf";
}, {
    readonly pattern: "cursor";
    readonly name: "cursor";
}, {
    readonly pattern: "vscode";
    readonly name: "vscode";
}, {
    readonly pattern: "cline";
    readonly name: "cline";
}, {
    readonly pattern: "vs code";
    readonly name: "vscode";
}, {
    readonly pattern: "visual studio code";
    readonly name: "vscode";
}];
/**
 * Ecosystem identifier for npm packages in vulnerability databases.
 * @constant {string}
 */
export declare const NPM_ECOSYSTEM = "npm";
/**
 * Timeout configurations for various operations in milliseconds.
 * @constant {Record<string, number>}
 */
export declare const DEFAULT_TIMEOUTS: {
    readonly PACKAGE_MANAGER: 60000;
    readonly HTTP_REQUEST: 30000;
    readonly RATE_LIMIT_RETRY: 1000;
};
/**
 * Cache settings for various caching scenarios.
 * @constant {Record<string, number>}
 */
export declare const CACHE_SETTINGS: {
    readonly DEFAULT_TTL: 600;
    readonly SHORT_TTL: 300;
    readonly LONG_TTL: 3600;
    readonly CHECK_PERIOD: 120;
    readonly MAX_KEYS: 1000;
};
/**
 * HTTP server and client configurations.
 * @constant {Record<string, number | string>}
 */
export declare const HTTP_SETTINGS: {
    readonly DEFAULT_PORT: 3000;
    readonly RATE_LIMIT_CONCURRENT: 5;
    readonly USER_AGENT: "mcp-package-manager/5.0.0";
};
/**
 * Quality weights for package search scoring.
 * @constant {Record<string, number>}
 */
export declare const SEARCH_QUALITY_WEIGHTS: {
    readonly QUALITY: 0.9;
    readonly POPULARITY: 0.8;
    readonly MAINTENANCE: 0.7;
};
/**
 * Rate limiting configurations.
 * @constant {Record<string, number>}
 */
export declare const RATE_LIMITING: {
    readonly REQUESTS_PER_HOUR: 1000;
    readonly WINDOW_MS: number;
};
/**
 * Standard CORS headers for API responses.
 * @constant {Record<string, string>}
 */
export declare const CORS_HEADERS: {
    readonly 'Access-Control-Allow-Origin': "*";
    readonly 'Access-Control-Allow-Headers': "Content-Type, Authorization";
    readonly 'Access-Control-Allow-Methods': "GET, POST, OPTIONS";
};
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
export declare function detectEditorFromUserAgent(userAgent: string): string;
//# sourceMappingURL=constants.d.ts.map