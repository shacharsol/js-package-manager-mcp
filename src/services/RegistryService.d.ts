import { Package, DownloadStats, BundleSize, PackageSearchResult } from '../models/Package.js';
/**
 * Service for interacting with npm registry and related APIs including bundlephobia.
 * Provides methods to search packages, retrieve metadata, download statistics, and bundle size information.
 * Handles API communication with proper error handling and data transformation.
 *
 * @class RegistryService
 * @example
 * ```typescript
 * const registryService = new RegistryService();
 *
 * // Search for packages
 * const results = await registryService.search('react', 10);
 *
 * // Get package information
 * const packageInfo = await registryService.getPackageInfo('lodash');
 *
 * // Get download statistics
 * const stats = await registryService.getDownloadStats('lodash', 'last-month');
 *
 * // Get bundle size information
 * const bundleSize = await registryService.getBundleSize('lodash', '4.17.21');
 * ```
 */
export declare class RegistryService {
    private readonly registryUrl;
    private readonly bundlephobiaUrl;
    private readonly npmApiUrl;
    /**
     * Creates a new RegistryService instance with configurable API endpoints.
     *
     * @param registryUrl - NPM registry URL (default: URLS.NPM_REGISTRY)
     * @param bundlephobiaUrl - Bundlephobia API URL (default: URLS.BUNDLEPHOBIA_API)
     * @param npmApiUrl - NPM API URL (default: URLS.NPM_API)
     *
     * @example
     * ```typescript
     * // Use default endpoints
     * const registry = new RegistryService();
     *
     * // Use custom registry (e.g., private registry)
     * const privateRegistry = new RegistryService(
     *   'https://my-private-registry.com',
     *   URLS.BUNDLEPHOBIA_API,
     *   URLS.NPM_API
     * );
     * ```
     */
    constructor(registryUrl?: string, bundlephobiaUrl?: string, npmApiUrl?: string);
    /**
     * Searches for packages in the npm registry with quality scoring.
     * Uses npm's search API with configurable quality, popularity, and maintenance weights.
     *
     * @param query - Search query string
     * @param limit - Maximum number of results to return (default: 25)
     * @param from - Pagination offset (default: 0)
     * @returns Promise resolving to array of PackageSearchResult objects
     *
     * @example
     * ```typescript
     * // Basic search
     * const results = await registryService.search('react');
     *
     * // Search with pagination
     * const page2 = await registryService.search('react', 10, 10);
     *
     * // Process results
     * results.forEach(pkg => {
     *   console.log(`${pkg.name} - Score: ${pkg.score.final}`);
     *   console.log(`Quality: ${pkg.score.detail.quality}`);
     *   console.log(`Popularity: ${pkg.score.detail.popularity}`);
     * });
     * ```
     */
    search(query: string, limit?: number, from?: number): Promise<PackageSearchResult[]>;
    /**
     * Retrieves detailed package information from the npm registry.
     * Uses pacote to fetch package manifest with comprehensive metadata.
     *
     * @param packageName - Name of the package to retrieve
     * @param version - Specific version to fetch (defaults to latest)
     * @returns Promise resolving to Package object with complete metadata
     *
     * @example
     * ```typescript
     * // Get latest version
     * const lodash = await registryService.getPackageInfo('lodash');
     * console.log(`Latest: ${lodash.version}`);
     *
     * // Get specific version
     * const oldLodash = await registryService.getPackageInfo('lodash', '4.17.20');
     *
     * // Access package details
     * console.log(`Description: ${lodash.description}`);
     * console.log(`License: ${lodash.license}`);
     * console.log(`Dependencies:`, lodash.dependencies);
     * console.log(`Repository:`, lodash.repository?.url);
     * ```
     */
    getPackageInfo(packageName: string, version?: string): Promise<Package>;
    /**
     * Retrieves download statistics for a package from npm's download API.
     * Provides download counts for different time periods.
     *
     * @param packageName - Name of the package to get stats for
     * @param period - Time period for statistics
     * @returns Promise resolving to DownloadStats object
     *
     * @example
     * ```typescript
     * // Get monthly downloads
     * const monthlyStats = await registryService.getDownloadStats('lodash', 'last-month');
     * console.log(`Downloads: ${monthlyStats.downloads.toLocaleString()}`);
     *
     * // Get weekly downloads
     * const weeklyStats = await registryService.getDownloadStats('react', 'last-week');
     *
     * // Compare popularity
     * const [lodashStats, reactStats] = await Promise.all([
     *   registryService.getDownloadStats('lodash', 'last-month'),
     *   registryService.getDownloadStats('react', 'last-month')
     * ]);
     *
     * console.log(`Lodash: ${lodashStats.downloads}`);
     * console.log(`React: ${reactStats.downloads}`);
     * ```
     */
    getDownloadStats(packageName: string, period: 'last-day' | 'last-week' | 'last-month' | 'last-year'): Promise<DownloadStats>;
    /**
     * Get package bundle size information
     */
    getBundleSize(packageName: string, version?: string): Promise<BundleSize>;
    /**
     * Get package metadata from registry
     */
    getPackageMetadata(packageName: string): Promise<any>;
    /**
     * Get package versions
     */
    getPackageVersions(packageName: string): Promise<string[]>;
    /**
     * Check if package exists
     */
    packageExists(packageName: string): Promise<boolean>;
    /**
     * Transform search result from npm API format
     */
    private transformSearchResult;
    /**
     * Transform package manifest from pacote format
     */
    private transformPackageManifest;
    /**
     * Transform author information
     */
    private transformAuthor;
    /**
     * Rate limit helper for API calls
     */
    private rateLimitedFetch;
}
//# sourceMappingURL=RegistryService.d.ts.map