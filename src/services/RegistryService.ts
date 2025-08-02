import pacote from 'pacote';
import { fetch } from 'undici';
import { Package, PackageSearchResult, DownloadStats, BundleSize } from '../models/Package.js';

/**
 * Service for interacting with npm registry and related APIs
 */
export class RegistryService {
  private readonly registryUrl: string;
  private readonly bundlephobiaUrl: string;
  private readonly npmApiUrl: string;

  constructor(
    registryUrl: string = 'https://registry.npmjs.org',
    bundlephobiaUrl: string = 'https://bundlephobia.com/api',
    npmApiUrl: string = 'https://api.npmjs.org'
  ) {
    this.registryUrl = registryUrl;
    this.bundlephobiaUrl = bundlephobiaUrl;
    this.npmApiUrl = npmApiUrl;
  }

  /**
   * Search packages in npm registry
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
   * Get detailed package information
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
   * Get package download statistics
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