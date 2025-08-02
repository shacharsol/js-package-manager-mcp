import { execa } from 'execa';
import { existsSync } from 'fs';
import { join } from 'path';
import { PackageManagerType, PackageOperationResult, PackageOperation } from '../models/Package.js';
import { detectPackageManager } from '../pm-detect.js';
import { PACKAGE_MANAGERS } from '../constants.js';

/**
 * Service for interacting with package managers (npm, yarn, pnpm).
 * Provides methods to install, update, remove, audit, and manage packages programmatically.
 * Automatically detects the appropriate package manager and handles cross-platform compatibility.
 * 
 * @class PackageManagerService
 * @example
 * ```typescript
 * const pmService = new PackageManagerService(30000); // 30 second timeout
 * 
 * // Auto-detect and install packages
 * const result = await pmService.install(['lodash', 'axios'], '/path/to/project');
 * if (result.success) {
 *   console.log('Packages installed successfully');
 * }
 * 
 * // Update all packages
 * await pmService.update(undefined, '/path/to/project');
 * 
 * // Audit for vulnerabilities
 * const auditResult = await pmService.audit('/path/to/project', true); // with fix
 * ```
 */
export class PackageManagerService {
  private readonly timeout: number;

  /**
   * Creates a new PackageManagerService instance with configurable timeout.
   * 
   * @param timeout - Command execution timeout in milliseconds (default: 60000 = 1 minute)
   * 
   * @example
   * ```typescript
   * // Create with default 60-second timeout
   * const pmService = new PackageManagerService();
   * 
   * // Create with custom 30-second timeout for faster operations
   * const fastPmService = new PackageManagerService(30000);
   * 
   * // Create with longer timeout for large installs
   * const slowPmService = new PackageManagerService(300000); // 5 minutes
   * ```
   */
  constructor(timeout: number = 60000) {
    this.timeout = timeout;
  }

  /**
   * Detects which package manager is used in a project by checking for lock files.
   * Checks in order: pnpm-lock.yaml, yarn.lock, then defaults to npm.
   * 
   * @param cwd - The working directory to check (defaults to process.cwd())
   * @returns Promise resolving to the detected package manager type
   * 
   * @example
   * ```typescript
   * // Detect in current directory
   * const pm = await pmService.detectPackageManager();
   * console.log(`Using ${pm} package manager`);
   * 
   * // Detect in specific project
   * const projectPm = await pmService.detectPackageManager('/path/to/project');
   * if (projectPm === 'pnpm') {
   *   console.log('Project uses pnpm');
   * }
   * ```
   */
  async detectPackageManager(cwd?: string): Promise<PackageManagerType> {
    const workingDir = cwd || process.cwd();

    // Check for lock files to determine package manager
    if (existsSync(join(workingDir, 'pnpm-lock.yaml'))) {
      return PACKAGE_MANAGERS.PNPM;
    }
    
    if (existsSync(join(workingDir, 'yarn.lock'))) {
      return PACKAGE_MANAGERS.YARN;
    }
    
    // Default to npm
    return PACKAGE_MANAGERS.NPM;
  }

  /**
   * Installs packages using the specified package manager.
   * Supports development dependencies, global installation, and version specifications.
   * 
   * @param packages - List of package names to install (can include version specs like 'lodash@4.17.21')
   * @param cwd - Working directory for the install command (defaults to process.cwd())
   * @param dev - Whether to install as devDependencies (default: false)
   * @param global - Whether to install globally (default: false)
   * @param packageManager - The package manager to use (default: 'npm')
   * @returns Promise resolving to PackageOperationResult with success status and details
   * 
   * @example
   * ```typescript
   * // Install production dependencies
   * const result = await pmService.install(['lodash', 'axios']);
   * 
   * // Install dev dependencies with version specs
   * await pmService.install(['@types/node@18', 'typescript@5'], '/project', true);
   * 
   * // Install global packages
   * await pmService.install(['npm-check-updates'], undefined, false, true);
   * 
   * // Use specific package manager
   * await pmService.install(['react'], '/app', false, false, 'yarn');
   * ```
   */
  async install(
    packages: string[],
    cwd?: string,
    dev?: boolean,
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): Promise<PackageOperationResult> {
    const startTime = Date.now();
    
    try {
      const args = this.buildInstallArgs(packages, dev, global, packageManager);
      const result = await this.executeCommand(packageManager, args, cwd);
      
      return {
        success: true,
        packages,
        operation: 'install',
        packageManager,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(error, packages, 'install', packageManager, startTime);
    }
  }

  /**
   * Updates packages to their latest versions using the specified package manager.
   * Can update all packages or specific ones.
   * 
   * @param packages - List of specific package names to update (if undefined, updates all packages)
   * @param cwd - Working directory for the update command (defaults to process.cwd())
   * @param packageManager - The package manager to use (default: 'npm')
   * @returns Promise resolving to PackageOperationResult with success status and details
   * 
   * @example
   * ```typescript
   * // Update all packages
   * const result = await pmService.update();
   * 
   * // Update specific packages
   * await pmService.update(['lodash', 'axios'], '/project');
   * 
   * // Update with yarn
   * await pmService.update(['react', 'react-dom'], '/app', 'yarn');
   * 
   * if (result.success) {
   *   console.log('Update completed:', result.output);
   * }
   * ```
   */
  async update(
    packages?: string[],
    cwd?: string,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): Promise<PackageOperationResult> {
    const startTime = Date.now();
    const targetPackages = packages || ['all packages'];
    
    try {
      const args = this.buildUpdateArgs(packages, packageManager);
      const result = await this.executeCommand(packageManager, args, cwd);
      
      return {
        success: true,
        packages: targetPackages,
        operation: 'update',
        packageManager,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(error, targetPackages, 'update', packageManager, startTime);
    }
  }

  /**
   * Removes packages using the specified package manager.
   * Supports both local and global package removal.
   * 
   * @param packages - List of package names to remove
   * @param cwd - Working directory for the remove command (defaults to process.cwd())
   * @param global - Whether to remove globally installed packages (default: false)
   * @param packageManager - The package manager to use (default: 'npm')
   * @returns Promise resolving to PackageOperationResult with success status and details
   * 
   * @example
   * ```typescript
   * // Remove local packages
   * const result = await pmService.remove(['lodash', 'unused-package']);
   * 
   * // Remove global packages
   * await pmService.remove(['npm-check-updates'], undefined, true);
   * 
   * // Remove with specific package manager
   * await pmService.remove(['old-dep'], '/project', false, 'yarn');
   * 
   * if (result.success) {
   *   console.log('Packages removed:', result.packages);
   * }
   * ```
   */
  async remove(
    packages: string[],
    cwd?: string,
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): Promise<PackageOperationResult> {
    const startTime = Date.now();
    
    try {
      const args = this.buildRemoveArgs(packages, global, packageManager);
      const result = await this.executeCommand(packageManager, args, cwd);
      
      return {
        success: true,
        packages,
        operation: 'remove',
        packageManager,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(error, packages, 'remove', packageManager, startTime);
    }
  }

  /**
   * Checks for outdated packages using the specified package manager.
   * Shows which packages have newer versions available.
   * 
   * @param cwd - Working directory for the outdated command (defaults to process.cwd())
   * @param global - Whether to check globally installed packages (default: false)
   * @param packageManager - The package manager to use (default: 'npm')
   * @returns Promise resolving to PackageOperationResult with outdated package information
   * 
   * @example
   * ```typescript
   * // Check for outdated local packages
   * const result = await pmService.checkOutdated();
   * console.log('Outdated packages:', result.output);
   * 
   * // Check global packages
   * await pmService.checkOutdated(undefined, true);
   * 
   * // Check with yarn
   * await pmService.checkOutdated('/project', false, 'yarn');
   * 
   * // Parse output to get structured data
   * if (result.success && result.output.includes('Package')) {
   *   console.log('Updates available!');
   * }
   * ```
   */
  async checkOutdated(
    cwd?: string,
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): Promise<PackageOperationResult> {
    const startTime = Date.now();
    
    try {
      const args = this.buildOutdatedArgs(global, packageManager);
      const result = await this.executeCommand(packageManager, args, cwd, false); // Don't reject on non-zero exit
      
      return {
        success: true,
        packages: ['outdated check'],
        operation: 'outdated',
        packageManager,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(error, ['outdated check'], 'outdated', packageManager, startTime);
    }
  }

  /**
   * Audits dependencies for security vulnerabilities using the specified package manager.
   * Can automatically attempt to fix found vulnerabilities.
   * 
   * @param cwd - Working directory for the audit command (defaults to process.cwd())
   * @param fix - Whether to attempt to fix vulnerabilities automatically (default: false)
   * @param force - Whether to force fix even with breaking changes, npm only (default: false)
   * @param production - Whether to audit only production dependencies (default: false)
   * @param packageManager - The package manager to use (default: 'npm')
   * @returns Promise resolving to PackageOperationResult with vulnerability information
   * 
   * @example
   * ```typescript
   * // Basic security audit
   * const result = await pmService.audit();
   * console.log('Vulnerabilities found:', result.output);
   * 
   * // Audit and attempt to fix vulnerabilities
   * await pmService.audit('/project', true);
   * 
   * // Audit only production dependencies
   * await pmService.audit('/project', false, false, true);
   * 
   * // Force fix with npm (may introduce breaking changes)
   * await pmService.audit('/project', true, true, false, 'npm');
   * 
   * if (result.success) {
   *   const hasVulns = result.output.includes('vulnerabilities');
   *   console.log(hasVulns ? 'Vulnerabilities found' : 'No vulnerabilities');
   * }
   * ```
   */
  async audit(
    cwd?: string,
    fix?: boolean,
    force?: boolean,
    production?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): Promise<PackageOperationResult> {
    const startTime = Date.now();
    
    try {
      const args = this.buildAuditArgs(fix, force, production, packageManager);
      const result = await this.executeCommand(packageManager, args, cwd, false); // Don't reject on vulnerabilities found
      
      return {
        success: true,
        packages: ['audit'],
        operation: 'audit',
        packageManager,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(error, ['audit'], 'audit', packageManager, startTime);
    }
  }

  /**
   * Cleans the package manager cache to free up disk space and resolve caching issues.
   * Useful for troubleshooting installation problems or reclaiming storage.
   * 
   * @param cwd - Working directory for the cache clean command (defaults to process.cwd())
   * @param global - Whether to clean global cache (default: false)
   * @param packageManager - The package manager to use (default: 'npm')
   * @returns Promise resolving to PackageOperationResult with cache cleaning details
   * 
   * @example
   * ```typescript
   * // Clean local cache
   * const result = await pmService.cleanCache();
   * console.log('Cache cleaned:', result.output);
   * 
   * // Clean global cache
   * await pmService.cleanCache(undefined, true);
   * 
   * // Clean yarn cache
   * await pmService.cleanCache('/project', false, 'yarn');
   * 
   * // Useful for troubleshooting
   * if (installFailed) {
   *   console.log('Cleaning cache and retrying...');
   *   await pmService.cleanCache();
   *   await pmService.install(['problematic-package']);
   * }
   * ```
   */
  async cleanCache(
    cwd?: string,
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): Promise<PackageOperationResult> {
    const startTime = Date.now();
    
    try {
      const args = this.buildCleanArgs(global, packageManager);
      const result = await this.executeCommand(packageManager, args, cwd);
      
      return {
        success: true,
        packages: ['cache'],
        operation: 'audit', // Using audit as closest match
        packageManager,
        output: result.stdout,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return this.createErrorResult(error, ['cache'], 'audit', packageManager, startTime);
    }
  }

  /**
   * Execute a package manager command using execa.
   * @param packageManager - The package manager to use.
   * @param args - Arguments for the command.
   * @param cwd - Working directory.
   * @param reject - Whether to reject on non-zero exit code (default: true).
   * @returns The result of the execa command.
   */
  private async executeCommand(
    packageManager: PackageManagerType,
    args: string[],
    cwd?: string,
    reject: boolean = true
  ) {
    return await execa(packageManager, args, {
      cwd: cwd || process.cwd(),
      timeout: this.timeout,
      reject,
      stdio: 'pipe',
    });
  }

  /**
   * Build install command arguments for the specified package manager.
   * @param packages - List of package names to install.
   * @param dev - Whether to install as devDependencies.
   * @param global - Whether to install globally.
   * @param packageManager - The package manager to use.
   * @returns The argument array for the install command.
   */
  private buildInstallArgs(
    packages: string[],
    dev?: boolean,
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): string[] {
    const args: string[] = [];

    switch (packageManager) {
      case PACKAGE_MANAGERS.NPM:
        args.push('install');
        if (global) args.push('--global');
        if (dev) args.push('--save-dev');
        break;
      case PACKAGE_MANAGERS.YARN:
        args.push('add');
        if (global) args.push('global');
        if (dev) args.push('--dev');
        break;
      case PACKAGE_MANAGERS.PNPM:
        args.push('add');
        if (global) args.push('--global');
        if (dev) args.push('--save-dev');
        break;
    }

    args.push(...packages);
    return args;
  }

  /**
   * Build update command arguments for the specified package manager.
   * @param packages - List of package names to update (optional).
   * @param packageManager - The package manager to use.
   * @returns The argument array for the update command.
   */
  private buildUpdateArgs(
    packages?: string[],
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): string[] {
    const args: string[] = [];

    switch (packageManager) {
      case PACKAGE_MANAGERS.NPM:
        args.push('update');
        break;
      case PACKAGE_MANAGERS.YARN:
        args.push('upgrade');
        break;
      case PACKAGE_MANAGERS.PNPM:
        args.push('update');
        break;
    }

    if (packages) {
      args.push(...packages);
    }

    return args;
  }

  /**
   * Build remove command arguments for the specified package manager.
   * @param packages - List of package names to remove.
   * @param global - Whether to remove globally.
   * @param packageManager - The package manager to use.
   * @returns The argument array for the remove command.
   */
  private buildRemoveArgs(
    packages: string[],
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): string[] {
    const args: string[] = [];

    switch (packageManager) {
      case PACKAGE_MANAGERS.NPM:
        args.push('uninstall');
        if (global) args.push('--global');
        break;
      case PACKAGE_MANAGERS.YARN:
        args.push('remove');
        if (global) args.push('global');
        break;
      case PACKAGE_MANAGERS.PNPM:
        args.push('remove');
        if (global) args.push('--global');
        break;
    }

    args.push(...packages);
    return args;
  }

  /**
   * Build outdated command arguments for the specified package manager.
   * @param global - Whether to check globally.
   * @param packageManager - The package manager to use.
   * @returns The argument array for the outdated command.
   */
  private buildOutdatedArgs(
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): string[] {
    const args: string[] = ['outdated'];

    if (global) {
      switch (packageManager) {
        case PACKAGE_MANAGERS.NPM:
          args.push('--global');
          break;
        case PACKAGE_MANAGERS.YARN:
          args.push('global');
          break;
        case PACKAGE_MANAGERS.PNPM:
          args.push('--global');
          break;
      }
    }

    return args;
  }

  /**
   * Build audit command arguments for the specified package manager.
   * @param fix - Whether to attempt to fix vulnerabilities.
   * @param force - Whether to force fix (npm only).
   * @param production - Whether to audit only production dependencies.
   * @param packageManager - The package manager to use.
   * @returns The argument array for the audit command.
   */
  private buildAuditArgs(
    fix?: boolean,
    force?: boolean,
    production?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): string[] {
    const args: string[] = ['audit'];

    if (packageManager === PACKAGE_MANAGERS.NPM) {
      if (fix) {
        args.push('fix');
        if (force) args.push('--force');
      }
      if (production) args.push('--production');
    } else if (packageManager === PACKAGE_MANAGERS.YARN) {
      // Yarn 1.x uses different audit syntax
      if (fix) {
        // Yarn doesn't have built-in fix, would need yarn-audit-fix
        console.warn('Yarn audit fix not directly supported, consider using yarn-audit-fix package');
      }
    } else if (packageManager === PACKAGE_MANAGERS.PNPM) {
      if (fix) {
        // pnpm audit doesn't have built-in fix
        console.warn('PNPM audit fix not directly supported');
      }
      if (production) args.push('--prod');
    }

    return args;
  }

  /**
   * Build cache clean command arguments for the specified package manager.
   * @param global - Whether to clean global cache.
   * @param packageManager - The package manager to use.
   * @returns The argument array for the cache clean command.
   */
  private buildCleanArgs(
    global?: boolean,
    packageManager: PackageManagerType = PACKAGE_MANAGERS.NPM
  ): string[] {
    switch (packageManager) {
      case PACKAGE_MANAGERS.NPM:
        return ['cache', 'clean', '--force'];
      case PACKAGE_MANAGERS.YARN:
        return ['cache', 'clean'];
      case PACKAGE_MANAGERS.PNPM:
        return ['store', 'prune'];
      default:
        throw new Error(`Unknown package manager: ${packageManager}`);
    }
  }

  /**
   * Create a standardized error result for package operations.
   * @param error - The error object.
   * @param packages - List of package names involved in the operation.
   * @param operation - The operation type.
   * @param packageManager - The package manager used.
   * @param startTime - The operation start time (ms).
   * @returns The error result object.
   */
  private createErrorResult(
    error: any,
    packages: string[],
    operation: PackageOperation,
    packageManager: PackageManagerType,
    startTime: number
  ): PackageOperationResult {
    const errorMessage = error?.message || 'Unknown error';
    const stderr = error?.stderr || '';
    
    return {
      success: false,
      packages,
      operation,
      packageManager,
      output: stderr || errorMessage,
      errors: [errorMessage],
      duration: Date.now() - startTime,
    };
  }
}