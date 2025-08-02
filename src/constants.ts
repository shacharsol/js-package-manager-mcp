/**
 * The current protocol version for MCP agents.
 * Use this as the value for protocolVersion in API payloads and headers.
 */
/**
 * The protocol version string used for MCP agent communication.
 */
export const PROTOCOL_VERSION = "2024-11-05";

/**
 * The current version of the npm-plus-mcp-server service.
 */
/**
 * The semantic version of the npm-plus-mcp-server service.
 */
export const SERVICE_VERSION = "1.0.0";

/**
 * Supported user agent identifiers.
 */
/**
 * List of supported user agent identifiers for client detection.
 */
export const USER_AGENT_IDENTIFIERS = [
  'claude',
  'windsurf',
  'cursor',
  'vscode',
  'cline'
];

/**
 * Package manager names and identifiers.
 */
export const PACKAGE_MANAGERS = {
  NPM: 'npm' as const,
  YARN: 'yarn' as const,
  PNPM: 'pnpm' as const
} as const;

/**
 * Ecosystem identifier for npm packages.
 */
export const NPM_ECOSYSTEM = 'npm';

/**
 * External service URLs and API endpoints.
 */
export const URLS = {
  // NPM Registry and API
  NPM_REGISTRY: 'https://registry.npmjs.org',
  NPM_API: 'https://api.npmjs.org',
  NPM_WEBSITE: 'https://www.npmjs.com',
  
  // Bundle analysis services
  BUNDLEPHOBIA_API: 'https://bundlephobia.com/api',
  PACKAGEPHOBIA_API: 'https://packagephobia.com/v2/api.json',
  
  // Security databases
  GITHUB_ADVISORY_API: 'https://api.github.com/advisories',
  OSV_API: 'https://api.osv.dev/v1',
  OSV_WEBSITE: 'https://osv.dev/vulnerability',
  GITHUB_ADVISORIES_WEBSITE: 'https://github.com/advisories',
  
  // License information
  OPENSOURCE_LICENSES: 'https://opensource.org/licenses'
} as const;
