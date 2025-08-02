import pacote from 'pacote';
import { fetch } from 'undici';
import { Package, DownloadStats, BundleSize, PackageSearchResult } from '../models/Package.js';
import { URLS } from '../constants.js';

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
export class RegistryService {
  private readonly registryUrl: string;
  private readonly bundlephobiaUrl: string;
  private readonly npmApiUrl: string;

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
  constructor(
    registryUrl: string = URLS.NPM_REGISTRY,
    bundlephobiaUrl: string = URLS.BUNDLEPHOBIA_API,
    npmApiUrl: string = URLS.NPM_API
  ) {
    this.registryUrl = registryUrl;
    this.bundlephobiaUrl = bundlephobiaUrl;
    this.npmApiUrl = npmApiUrl;
  }

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
  async search(query: string, limit: number = 25, from: number = 0): Promise<PackageSearchResult[]> {
    try {
      const searchUrl = `${this.npmApiUrl}/search`;
      const params = new URLSearchParams({
        text: query,
        size: limit.toString(),
        from: from.toString(),
        quality: '0.9',
        popularity: '0.8',
        maintenance: '0.7',
      });

      const response = await fetch(`${searchUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      return data.objects?.map((item: any) => this.transformSearchResult(item)) || [];
    } catch (error) {
      throw new Error(`Failed to search packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
  async getPackageInfo(packageName: string, version?: string): Promise<Package> {
    try {
      const manifest = await pacote.manifest(`${packageName}${version ? `@${version}` : ''}`, {
        registry: this.registryUrl,
      });

      return this.transformPackageManifest(manifest);
    } catch (error) {
      throw new Error(`Failed to get package info for ${packageName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
  async getDownloadStats(packageName: string, period: 'last-day' | 'last-week' | 'last-month' | 'last-year'): Promise<DownloadStats> {
    try {
      const encodedName = encodeURIComponent(packageName);
      const response = await fetch(`${this.npmApiUrl}/downloads/point/${period}/${encodedName}`);
      
      if (!response.ok) {
        throw new Error(`Downloads API failed: ${response.status}`);
      }

      const data = await response.json() as any;
      
      return {
        downloads: data.downloads || 0,
        period,
        start: data.start || '',
        end: data.end || '',
      };
    } catch (error) {
      throw new Error(`Failed to get download stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get package bundle size information
   */
  async getBundleSize(packageName: string, version?: string): Promise<BundleSize> {
    try {
      const encodedName = encodeURIComponent(packageName);
      const versionParam = version ? `@${version}` : '';
      const response = await fetch(`${this.bundlephobiaUrl}/size?package=${encodedName}${versionParam}`);
      
      if (!response.ok) {
        throw new Error(`Bundlephobia API failed: ${response.status}`);
      }

      const data = await response.json() as any;
      
      return {
        size: data.size || 0,
        gzip: data.gzip || 0,
        dependency: data.dependencyCount || 0,
        dependencyCount: data.dependencyCount || 0,
      };
    } catch (error) {
      // Bundlephobia might not have data for all packages, so we provide defaults
      return {
        size: 0,
        gzip: 0,
        dependency: 0,
        dependencyCount: 0,
      };
    }
  }

  /**
   * Get package metadata from registry
   */
  async getPackageMetadata(packageName: string): Promise<any> {
    try {
      const response = await fetch(`${this.registryUrl}/${encodeURIComponent(packageName)}`);
      
      if (!response.ok) {
        throw new Error(`Registry request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get package metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get package versions
   */
  async getPackageVersions(packageName: string): Promise<string[]> {
    try {
      const metadata = await this.getPackageMetadata(packageName);
      return Object.keys(metadata.versions || {}).sort((a, b) => {
        // Simple version sort - in production, use semver.sort
        return b.localeCompare(a);
      });
    } catch (error) {
      throw new Error(`Failed to get package versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if package exists
   */
  async packageExists(packageName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.registryUrl}/${encodeURIComponent(packageName)}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Transform search result from npm API format
   */
  private transformSearchResult(item: any): PackageSearchResult {
    const pkg = item.package;
    
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      keywords: pkg.keywords,
      author: this.transformAuthor(pkg.author),
      publishedAt: pkg.date,
      score: {
        final: item.score?.final || 0,
        detail: {
          quality: item.score?.detail?.quality || 0,
          popularity: item.score?.detail?.popularity || 0,
          maintenance: item.score?.detail?.maintenance || 0,
        },
      },
      searchScore: item.searchScore,
    };
  }

  /**
   * Transform package manifest from pacote format
   */
  private transformPackageManifest(manifest: any): Package {
    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      keywords: manifest.keywords,
      homepage: manifest.homepage,
      repository: manifest.repository ? {
        type: manifest.repository.type || 'git',
        url: manifest.repository.url || manifest.repository,
        directory: manifest.repository.directory,
      } : undefined,
      bugs: manifest.bugs ? {
        url: manifest.bugs.url || manifest.bugs,
        email: manifest.bugs.email,
      } : undefined,
      license: manifest.license,
      author: this.transformAuthor(manifest.author),
      maintainers: manifest.maintainers?.map((m: any) => this.transformAuthor(m)),
      dependencies: manifest.dependencies,
      devDependencies: manifest.devDependencies,
      peerDependencies: manifest.peerDependencies,
      engines: manifest.engines,
      scripts: manifest.scripts,
      publishedAt: manifest.time?.[manifest.version],
    };
  }

  /**
   * Transform author information
   */
  private transformAuthor(author: any): any {
    if (!author) return undefined;
    
    if (typeof author === 'string') {
      // Parse "Name <email> (url)" format
      const match = author.match(/^([^<(]+?)(?:\s*<([^>]+)>)?(?:\s*\(([^)]+)\))?$/);
      if (match) {
        return {
          name: match[1].trim(),
          email: match[2]?.trim(),
          url: match[3]?.trim(),
        };
      }
      return { name: author };
    }
    
    return {
      name: author.name,
      email: author.email,
      url: author.url,
    };
  }

  /**
   * Rate limit helper for API calls
   */
  private async rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    // Simple rate limiting - in production, use a proper rate limiter
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      // Rate limited, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetch(url, options);
    }
    
    return response;
  }
}