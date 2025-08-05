import { Package, PackageSearchResult, PackageOperationResult, PackageInstallRequest, PackageManagerType } from '../models/Package.js';
import { CacheService } from './CacheService.js';
import { PackageManagerService } from './PackageManagerService.js';
import { SecurityService } from './SecurityService.js';
import { RegistryService } from './RegistryService.js';
/**
 * Main service orchestrating package operations across multiple specialized services.
 * Provides a unified interface for package search, installation, security analysis, and management.
 * Integrates caching, registry access, security scanning, and package manager operations.
 *
 * @class PackageService
 * @example
 * ```typescript
 * const packageService = new PackageService(
 *   cacheService,
 *   packageManagerService,
 *   securityService,
 *   registryService
 * );
 *
 * // Search for packages
 * const results = await packageService.searchPackages('react', 10);
 *
 * // Get detailed package info with security analysis
 * const packageInfo = await packageService.getPackageInfo('lodash');
 *
 * // Install packages with auto-detection
 * await packageService.installPackages({
 *   packages: ['react', 'react-dom'],
 *   cwd: '/my-project',
 *   dev: false
 * });
 * ```
 */
export declare class PackageService {
    private cacheService;
    private packageManagerService;
    private securityService;
    private registryService;
    /**
     * Creates a new PackageService instance with required service dependencies.
     *
     * @param cacheService - Service for caching API responses and computed data
     * @param packageManagerService - Service for package manager operations (npm/yarn/pnpm)
     * @param securityService - Service for security vulnerability analysis
     * @param registryService - Service for npm registry API interactions
     *
     * @example
     * ```typescript
     * const cache = new CacheService();
     * const pmService = new PackageManagerService();
     * const securityService = new SecurityService();
     * const registryService = new RegistryService();
     *
     * const packageService = new PackageService(
     *   cache,
     *   pmService,
     *   securityService,
     *   registryService
     * );
     * ```
     */
    constructor(cacheService: CacheService, packageManagerService: PackageManagerService, securityService: SecurityService, registryService: RegistryService);
    /**
     * Searches for packages in the npm registry with caching support.
     * Results are cached for 15 minutes to improve performance.
     *
     * @param query - Search query string
     * @param limit - Maximum number of results to return (default: 25)
     * @param from - Pagination offset (default: 0)
     * @returns Promise resolving to array of PackageSearchResult objects
     *
     * @example
     * ```typescript
     * // Basic search
     * const results = await packageService.searchPackages('react');
     *
     * // Search with pagination
     * const moreResults = await packageService.searchPackages('react', 10, 10);
     *
     * // Process results
     * results.forEach(pkg => {
     *   console.log(`${pkg.name}: ${pkg.description}`);
     *   console.log(`Score: ${pkg.score.final}`);
     * });
     * ```
     */
    searchPackages(query: string, limit?: number, from?: number): Promise<PackageSearchResult[]>;
    /**
     * Retrieves comprehensive package information including metadata, security analysis, and statistics.
     * Combines data from multiple sources and caches the result for 1 hour.
     *
     * @param packageName - Name of the package to retrieve information for
     * @param version - Specific version to analyze (defaults to 'latest')
     * @returns Promise resolving to complete Package object with enhanced data
     *
     * @example
     * ```typescript
     * // Get latest version info
     * const lodash = await packageService.getPackageInfo('lodash');
     * console.log(`Latest version: ${lodash.version}`);
     * console.log(`Bundle size: ${lodash.bundleSize?.size} bytes`);
     *
     * // Get specific version
     * const oldLodash = await packageService.getPackageInfo('lodash', '4.17.20');
     *
     * // Check security info
     * if (lodash.securityInfo?.hasVulnerabilities) {
     *   console.log('⚠️ Security vulnerabilities found!');
     *   lodash.securityInfo.vulnerabilities.forEach(vuln => {
     *     console.log(`- ${vuln.title} (${vuln.severity})`);
     *   });
     * }
     *
     * // Check download stats
     * if (lodash.downloadStats) {
     *   console.log(`Downloads: ${lodash.downloadStats.downloads}`);
     * }
     * ```
     */
    getPackageInfo(packageName: string, version?: string): Promise<Package>;
    /**
     * Installs packages using the appropriate package manager with automatic detection.
     * Delegates to PackageManagerService after detecting the correct package manager.
     *
     * @param request - Package installation request with packages and options
     * @returns Promise resolving to PackageOperationResult with installation details
     *
     * @example
     * ```typescript
     * // Install production dependencies
     * const result = await packageService.installPackages({
     *   packages: ['lodash', 'axios'],
     *   cwd: '/my-project'
     * });
     *
     * // Install dev dependencies
     * await packageService.installPackages({
     *   packages: ['@types/node', 'typescript'],
     *   cwd: '/my-project',
     *   dev: true
     * });
     *
     * // Install with specific package manager
     * await packageService.installPackages({
     *   packages: ['react'],
     *   packageManager: 'yarn'
     * });
     *
     * if (result.success) {
     *   console.log(`Installed ${result.packages.length} packages in ${result.duration}ms`);
     * } else {
     *   console.error('Installation failed:', result.errors);
     * }
     * ```
     */
    installPackages(request: PackageInstallRequest): Promise<PackageOperationResult>;
    /**
     * Update packages
     */
    updatePackages(packages: string[] | undefined, cwd?: string, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
    /**
     * Remove packages
     */
    removePackages(packages: string[], cwd?: string, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
    /**
     * Check for outdated packages
     */
    checkOutdated(cwd?: string, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
    /**
     * Audit dependencies for vulnerabilities
     */
    auditDependencies(cwd?: string, fix?: boolean, force?: boolean, production?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
    /**
     * Clean package manager cache
     */
    cleanCache(cwd?: string, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
}
//# sourceMappingURL=PackageService.d.ts.map