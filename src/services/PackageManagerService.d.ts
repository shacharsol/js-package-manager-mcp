import { PackageManagerType, PackageOperationResult } from '../models/Package.js';
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
export declare class PackageManagerService {
    private readonly timeout;
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
    constructor(timeout?: number);
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
    detectPackageManager(cwd?: string): Promise<PackageManagerType>;
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
    install(packages: string[], cwd?: string, dev?: boolean, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
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
    update(packages?: string[], cwd?: string, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
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
    remove(packages: string[], cwd?: string, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
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
    checkOutdated(cwd?: string, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
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
    audit(cwd?: string, fix?: boolean, force?: boolean, production?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
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
    cleanCache(cwd?: string, global?: boolean, packageManager?: PackageManagerType): Promise<PackageOperationResult>;
    /**
     * Execute a package manager command using execa.
     * @param packageManager - The package manager to use.
     * @param args - Arguments for the command.
     * @param cwd - Working directory.
     * @param reject - Whether to reject on non-zero exit code (default: true).
     * @returns The result of the execa command.
     */
    private executeCommand;
    /**
     * Build install command arguments for the specified package manager.
     * @param packages - List of package names to install.
     * @param dev - Whether to install as devDependencies.
     * @param global - Whether to install globally.
     * @param packageManager - The package manager to use.
     * @returns The argument array for the install command.
     */
    private buildInstallArgs;
    /**
     * Build update command arguments for the specified package manager.
     * @param packages - List of package names to update (optional).
     * @param packageManager - The package manager to use.
     * @returns The argument array for the update command.
     */
    private buildUpdateArgs;
    /**
     * Build remove command arguments for the specified package manager.
     * @param packages - List of package names to remove.
     * @param global - Whether to remove globally.
     * @param packageManager - The package manager to use.
     * @returns The argument array for the remove command.
     */
    private buildRemoveArgs;
    /**
     * Build outdated command arguments for the specified package manager.
     * @param global - Whether to check globally.
     * @param packageManager - The package manager to use.
     * @returns The argument array for the outdated command.
     */
    private buildOutdatedArgs;
    /**
     * Build audit command arguments for the specified package manager.
     * @param fix - Whether to attempt to fix vulnerabilities.
     * @param force - Whether to force fix (npm only).
     * @param production - Whether to audit only production dependencies.
     * @param packageManager - The package manager to use.
     * @returns The argument array for the audit command.
     */
    private buildAuditArgs;
    /**
     * Build cache clean command arguments for the specified package manager.
     * @param global - Whether to clean global cache.
     * @param packageManager - The package manager to use.
     * @returns The argument array for the cache clean command.
     */
    private buildCleanArgs;
    /**
     * Create a standardized error result for package operations.
     * @param error - The error object.
     * @param packages - List of package names involved in the operation.
     * @param operation - The operation type.
     * @param packageManager - The package manager used.
     * @param startTime - The operation start time (ms).
     * @returns The error result object.
     */
    private createErrorResult;
}
//# sourceMappingURL=PackageManagerService.d.ts.map