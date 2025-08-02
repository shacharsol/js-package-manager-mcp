/**
 * Represents a complete npm package with all metadata and analysis information.
 * This is the core data structure used throughout the system for package operations.
 * 
 * @interface Package
 * @example
 * ```typescript
 * const pkg: Package = {
 *   name: "lodash",
 *   version: "4.17.21",
 *   description: "A modern JavaScript utility library",
 *   license: "MIT",
 *   dependencies: { "core-js": "^3.0.0" }
 * };
 * ```
 */
export interface Package {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  repository?: Repository;
  bugs?: BugsInfo;
  license?: string;
  author?: Author | string;
  maintainers?: Author[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  scripts?: Record<string, string>;
  publishedAt?: string;
  downloadStats?: DownloadStats;
  bundleSize?: BundleSize;
  securityInfo?: SecurityInfo;
}

/**
 * Repository information for a package, typically from package.json repository field.
 * 
 * @interface Repository
 * @example
 * ```typescript
 * const repo: Repository = {
 *   type: "git",
 *   url: "https://github.com/lodash/lodash.git",
 *   directory: "packages/core"
 * };
 * ```
 */
export interface Repository {
  type: string;
  url: string;
  directory?: string;
}

/**
 * Bug reporting information for a package.
 * 
 * @interface BugsInfo
 * @example
 * ```typescript
 * const bugs: BugsInfo = {
 *   url: "https://github.com/lodash/lodash/issues",
 *   email: "support@lodash.com"
 * };
 * ```
 */
export interface BugsInfo {
  url?: string;
  email?: string;
}

/**
 * Author or maintainer information for a package.
 * 
 * @interface Author
 * @example
 * ```typescript
 * const author: Author = {
 *   name: "John Dalton",
 *   email: "john@lodash.com",
 *   url: "https://jdalton.github.io/"
 * };
 * ```
 */
export interface Author {
  name: string;
  email?: string;
  url?: string;
}

/**
 * Download statistics for a package from npm registry.
 * 
 * @interface DownloadStats
 * @example
 * ```typescript
 * const stats: DownloadStats = {
 *   downloads: 1234567,
 *   period: "last-month",
 *   start: "2024-01-01",
 *   end: "2024-01-31"
 * };
 * ```
 */
export interface DownloadStats {
  downloads: number;
  period: 'last-day' | 'last-week' | 'last-month' | 'last-year';
  start: string;
  end: string;
}

/**
 * Bundle size analysis information from bundlephobia or similar services.
 * 
 * @interface BundleSize
 * @example
 * ```typescript
 * const bundleSize: BundleSize = {
 *   size: 67890,      // Raw size in bytes
 *   gzip: 12345,      // Gzipped size in bytes
 *   dependency: 45678, // Size including dependencies
 *   dependencyCount: 5 // Number of dependencies
 * };
 * ```
 */
export interface BundleSize {
  size: number;
  gzip: number;
  dependency: number;
  dependencyCount: number;
}

/**
 * Security vulnerability information for a package.
 * 
 * @interface SecurityInfo
 * @example
 * ```typescript
 * const security: SecurityInfo = {
 *   vulnerabilities: [vuln1, vuln2],
 *   hasVulnerabilities: true,
 *   severity: "high"
 * };
 * ```
 */
export interface SecurityInfo {
  vulnerabilities: Vulnerability[];
  hasVulnerabilities: boolean;
  severity: SecuritySeverity;
}

/**
 * Detailed information about a specific security vulnerability.
 * 
 * @interface Vulnerability
 * @example
 * ```typescript
 * const vuln: Vulnerability = {
 *   id: "CVE-2021-23337",
 *   title: "Prototype Pollution",
 *   severity: "high",
 *   url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
 *   overview: "lodash is vulnerable to prototype pollution",
 *   recommendation: "Upgrade to version 4.17.21 or later",
 *   versions: ["<4.17.21"],
 *   published: "2021-02-15T00:00:00.000Z",
 *   updated: "2021-02-16T00:00:00.000Z"
 * };
 * ```
 */
export interface Vulnerability {
  id: string;
  title: string;
  severity: SecuritySeverity;
  url: string;
  overview: string;
  recommendation: string;
  versions: string[];
  published: string;
  updated: string;
}

/**
 * Security severity levels for vulnerabilities, ordered from least to most severe.
 * 
 * @typedef {('info'|'low'|'moderate'|'high'|'critical')} SecuritySeverity
 */
export type SecuritySeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Package search result with ranking information from npm search API.
 * Extends Package with search-specific scoring data.
 * 
 * @interface PackageSearchResult
 * @extends {Pick<Package, 'name'|'version'|'description'|'keywords'|'author'|'publishedAt'>}
 * @example
 * ```typescript
 * const result: PackageSearchResult = {
 *   name: "lodash",
 *   version: "4.17.21",
 *   description: "A modern JavaScript utility library",
 *   score: {
 *     final: 0.95,
 *     detail: { quality: 0.98, popularity: 0.92, maintenance: 0.95 }
 *   },
 *   searchScore: 0.87
 * };
 * ```
 */
export interface PackageSearchResult extends Pick<Package, 'name' | 'version' | 'description' | 'keywords' | 'author' | 'publishedAt'> {
  score: SearchScore;
  searchScore?: number;
}

/**
 * Search scoring information from npm registry search results.
 * 
 * @interface SearchScore
 * @example
 * ```typescript
 * const score: SearchScore = {
 *   final: 0.95,
 *   detail: {
 *     quality: 0.98,    // Code quality metrics
 *     popularity: 0.92, // Download and usage metrics
 *     maintenance: 0.95 // Update frequency and maintenance
 *   }
 * };
 * ```
 */
export interface SearchScore {
  final: number;
  detail: {
    quality: number;
    popularity: number;
    maintenance: number;
  };
}

/**
 * Request parameters for package installation operations.
 * Used by install tools to specify what packages to install and how.
 * 
 * @interface PackageInstallRequest
 * @example
 * ```typescript
 * const request: PackageInstallRequest = {
 *   packages: ["lodash@4.17.21", "axios"],
 *   cwd: "/path/to/project",
 *   dev: false,
 *   global: false,
 *   packageManager: "npm"
 * };
 * ```
 */
export interface PackageInstallRequest {
  packages: string[];
  cwd?: string;
  dev?: boolean;
  global?: boolean;
  packageManager?: PackageManagerType;
}

/**
 * Result of a package management operation (install, update, remove, etc.).
 * Contains execution details, output, and performance metrics.
 * 
 * @interface PackageOperationResult
 * @example
 * ```typescript
 * const result: PackageOperationResult = {
 *   success: true,
 *   packages: ["lodash", "axios"],
 *   operation: "install",
 *   packageManager: "npm",
 *   output: "added 2 packages in 3.2s",
 *   duration: 3200
 * };
 * ```
 */
export interface PackageOperationResult {
  success: boolean;
  packages: string[];
  operation: PackageOperation;
  packageManager: PackageManagerType;
  output: string;
  errors?: string[];
  duration: number;
}

/**
 * Types of package management operations supported by the system.
 * 
 * @typedef {('install'|'update'|'remove'|'audit'|'outdated')} PackageOperation
 */
export type PackageOperation = 'install' | 'update' | 'remove' | 'audit' | 'outdated';

/**
 * Supported package managers for JavaScript projects.
 * 
 * @typedef {('npm'|'yarn'|'pnpm')} PackageManagerType
 */
export type PackageManagerType = 'npm' | 'yarn' | 'pnpm';

/**
 * Represents a single node in a dependency tree structure.
 * Contains package information and references to child dependencies.
 * 
 * @interface DependencyNode
 * @example
 * ```typescript
 * const node: DependencyNode = {
 *   name: "lodash",
 *   version: "4.17.21",
 *   dependencies: [childNode1, childNode2],
 *   devDependency: false,
 *   peerDependency: false,
 *   circular: false,
 *   path: ["root", "express", "lodash"]
 * };
 * ```
 */
export interface DependencyNode {
  name: string;
  version: string;
  dependencies?: DependencyNode[];
  devDependency?: boolean;
  peerDependency?: boolean;
  circular?: boolean;
  path: string[];
}

/**
 * Complete dependency tree for a project with issue analysis.
 * 
 * @interface DependencyTree
 * @example
 * ```typescript
 * const tree: DependencyTree = {
 *   name: "my-project",
 *   version: "1.0.0",
 *   dependencies: [node1, node2],
 *   issues: [circularIssue, orphanedIssue]
 * };
 * ```
 */
export interface DependencyTree {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  issues: DependencyIssue[];
}

/**
 * Represents an issue found during dependency analysis.
 * 
 * @interface DependencyIssue
 * @example
 * ```typescript
 * const issue: DependencyIssue = {
 *   type: "circular",
 *   severity: "warning",
 *   description: "Circular dependency detected between A and B",
 *   affected: ["package-a", "package-b"],
 *   recommendation: "Consider refactoring to remove circular dependency"
 * };
 * ```
 */
export interface DependencyIssue {
  type: 'circular' | 'orphaned' | 'missing' | 'version-conflict';
  severity: 'warning' | 'error';
  description: string;
  affected: string[];
  recommendation?: string;
}

/**
 * Detailed license information including SPDX identifier and compliance flags.
 * 
 * @interface LicenseInfo
 * @example
 * ```typescript
 * const license: LicenseInfo = {
 *   spdxId: "MIT",
 *   name: "MIT License",
 *   url: "https://opensource.org/licenses/MIT",
 *   osi: true,
 *   fsf: true,
 *   commercial: true,
 *   copyleft: false
 * };
 * ```
 */
export interface LicenseInfo {
  spdxId?: string;
  name: string;
  url?: string;
  text?: string;
  osi: boolean;
  fsf: boolean;
  commercial: boolean;
  copyleft: boolean;
}

/**
 * License information for a specific package version.
 * 
 * @interface PackageLicense
 * @example
 * ```typescript
 * const pkgLicense: PackageLicense = {
 *   packageName: "lodash",
 *   version: "4.17.21",
 *   license: "MIT",
 *   licenseFile: "/node_modules/lodash/LICENSE"
 * };
 * ```
 */
export interface PackageLicense {
  packageName: string;
  version: string;
  license: LicenseInfo | string;
  licenseFile?: string;
}

/**
 * Summary of all licenses found in a project's dependencies.
 * 
 * @interface LicenseSummary
 * @example
 * ```typescript
 * const summary: LicenseSummary = {
 *   packages: [license1, license2],
 *   licenseCounts: { "MIT": 15, "Apache-2.0": 3 },
 *   totalPackages: 18,
 *   issues: []
 * };
 * ```
 */
export interface LicenseSummary {
  packages: PackageLicense[];
  licenseCounts: Record<string, number>;
  totalPackages: number;
  issues: LicenseIssue[];
}

/**
 * Represents a license compliance issue found during analysis.
 * 
 * @interface LicenseIssue
 * @example
 * ```typescript
 * const issue: LicenseIssue = {
 *   type: "incompatible",
 *   packages: ["gpl-package"],
 *   description: "GPL license incompatible with commercial use",
 *   severity: "error"
 * };
 * ```
 */
export interface LicenseIssue {
  type: 'missing' | 'unknown' | 'incompatible' | 'copyleft';
  packages: string[];
  description: string;
  severity: 'info' | 'warning' | 'error';
}