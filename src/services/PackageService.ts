import { Package, PackageSearchResult, PackageOperationResult, PackageInstallRequest, PackageManagerType } from '../models/Package.js';
import { CacheService } from './CacheService.js';
import { PackageManagerService } from './PackageManagerService.js';
import { SecurityService } from './SecurityService.js';
import { RegistryService } from './RegistryService.js';

/**
 * Main service for package operations
 */
export class PackageService {
  private cacheService: CacheService;
  private packageManagerService: PackageManagerService;
  private securityService: SecurityService;
  private registryService: RegistryService;

  constructor(
    cacheService: CacheService,
    packageManagerService: PackageManagerService,
    securityService: SecurityService,
    registryService: RegistryService
  ) {
    this.cacheService = cacheService;
    this.packageManagerService = packageManagerService;
    this.securityService = securityService;
    this.registryService = registryService;
  }

  /**
   * Search for packages in the npm registry
   */
  async searchPackages(
    query: string,
    limit: number = 25,
    from: number = 0
  ): Promise<PackageSearchResult[]> {
    const cacheKey = `search:${query}:${limit}:${from}`;
    
    // Check cache first
    const cached = await this.cacheService.get<PackageSearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Search registry
    const results = await this.registryService.search(query, limit, from);
    
    // Cache results
    await this.cacheService.set(cacheKey, results, 900); // 15 minutes
    
    return results;
  }

  /**
   * Get detailed package information
   */
  async getPackageInfo(packageName: string, version?: string): Promise<Package> {
    const cacheKey = `package:${packageName}:${version || 'latest'}`;
    
    // Check cache first
    const cached = await this.cacheService.get<Package>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from registry
    const packageInfo = await this.registryService.getPackageInfo(packageName, version);
    
    // Enhance with additional data
    const [downloadStats, bundleSize, securityInfo] = await Promise.all([
      this.registryService.getDownloadStats(packageName, 'last-week').catch(() => undefined),
      this.registryService.getBundleSize(packageName, packageInfo.version).catch(() => undefined),
      this.securityService.checkVulnerabilities(packageName, packageInfo.version).catch(() => undefined)
    ]);

    const enhancedPackage: Package = {
      ...packageInfo,
      downloadStats,
      bundleSize,
      securityInfo
    };

    // Cache for 1 hour
    await this.cacheService.set(cacheKey, enhancedPackage, 3600);
    
    return enhancedPackage;
  }

  /**
   * Install packages
   */
  async installPackages(request: PackageInstallRequest): Promise<PackageOperationResult> {
    const packageManager = request.packageManager || 
      await this.packageManagerService.detectPackageManager(request.cwd);

    return this.packageManagerService.install(
      request.packages,
      request.cwd,
      request.dev,
      request.global,
      packageManager
    );
  }

  /**
   * Update packages
   */
  async updatePackages(
    packages: string[] | undefined,
    cwd?: string,
    packageManager?: PackageManagerType
  ): Promise<PackageOperationResult> {
    const pm = packageManager || 
      await this.packageManagerService.detectPackageManager(cwd);

    return this.packageManagerService.update(packages, cwd, pm);
  }

  /**
   * Remove packages
   */
  async removePackages(
    packages: string[],
    cwd?: string,
    global?: boolean,
    packageManager?: PackageManagerType
  ): Promise<PackageOperationResult> {
    const pm = packageManager || 
      await this.packageManagerService.detectPackageManager(cwd);

    return this.packageManagerService.remove(packages, cwd, global, pm);
  }

  /**
   * Check for outdated packages
   */
  async checkOutdated(
    cwd?: string,
    global?: boolean,
    packageManager?: PackageManagerType
  ): Promise<PackageOperationResult> {
    const pm = packageManager || 
      await this.packageManagerService.detectPackageManager(cwd);

    return this.packageManagerService.checkOutdated(cwd, global, pm);
  }

  /**
   * Audit dependencies for vulnerabilities
   */
  async auditDependencies(
    cwd?: string,
    fix?: boolean,
    force?: boolean,
    production?: boolean,
    packageManager?: PackageManagerType
  ): Promise<PackageOperationResult> {
    const pm = packageManager || 
      await this.packageManagerService.detectPackageManager(cwd);

    return this.packageManagerService.audit(cwd, fix, force, production, pm);
  }

  /**
   * Clean package manager cache
   */
  async cleanCache(
    cwd?: string,
    global?: boolean,
    packageManager?: PackageManagerType
  ): Promise<PackageOperationResult> {
    const pm = packageManager || 
      await this.packageManagerService.detectPackageManager(cwd);

    return this.packageManagerService.cleanCache(cwd, global, pm);
  }
}