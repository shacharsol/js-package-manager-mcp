/**
 * Package model representing npm package information
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

export interface Repository {
  type: string;
  url: string;
  directory?: string;
}

export interface BugsInfo {
  url?: string;
  email?: string;
}

export interface Author {
  name: string;
  email?: string;
  url?: string;
}

export interface DownloadStats {
  downloads: number;
  period: 'last-day' | 'last-week' | 'last-month' | 'last-year';
  start: string;
  end: string;
}

export interface BundleSize {
  size: number;
  gzip: number;
  dependency: number;
  dependencyCount: number;
}

export interface SecurityInfo {
  vulnerabilities: Vulnerability[];
  hasVulnerabilities: boolean;
  severity: SecuritySeverity;
}

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

export type SecuritySeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Package search result with ranking information
 */
export interface PackageSearchResult extends Pick<Package, 'name' | 'version' | 'description' | 'keywords' | 'author' | 'publishedAt'> {
  score: SearchScore;
  searchScore?: number;
}

export interface SearchScore {
  final: number;
  detail: {
    quality: number;
    popularity: number;
    maintenance: number;
  };
}

/**
 * Package installation request
 */
export interface PackageInstallRequest {
  packages: string[];
  cwd?: string;
  dev?: boolean;
  global?: boolean;
  packageManager?: PackageManagerType;
}

/**
 * Package operation result
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

export type PackageOperation = 'install' | 'update' | 'remove' | 'audit' | 'outdated';
export type PackageManagerType = 'npm' | 'yarn' | 'pnpm';

/**
 * Dependency tree structure
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

export interface DependencyTree {
  name: string;
  version: string;
  dependencies: DependencyNode[];
  issues: DependencyIssue[];
}

export interface DependencyIssue {
  type: 'circular' | 'orphaned' | 'missing' | 'version-conflict';
  severity: 'warning' | 'error';
  description: string;
  affected: string[];
  recommendation?: string;
}

/**
 * License information
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

export interface PackageLicense {
  packageName: string;
  version: string;
  license: LicenseInfo | string;
  licenseFile?: string;
}

export interface LicenseSummary {
  packages: PackageLicense[];
  licenseCounts: Record<string, number>;
  totalPackages: number;
  issues: LicenseIssue[];
}

export interface LicenseIssue {
  type: 'missing' | 'unknown' | 'incompatible' | 'copyleft';
  packages: string[];
  description: string;
  severity: 'info' | 'warning' | 'error';
}