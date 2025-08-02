import { execa } from 'execa';
import { existsSync } from 'fs';
import { join } from 'path';
import { PackageManagerType, PackageOperationResult, PackageOperation } from '../models/Package.js';

/**
 * Service for interacting with package managers (npm, yarn, pnpm)
 */
export class PackageManagerService {
  private readonly timeout: number;

  constructor(timeout: number = 60000) {
    this.timeout = timeout;
  }

  /**
   * Detect which package manager is used in a project
   */
  async detectPackageManager(cwd?: string): Promise<PackageManagerType> {
    const workingDir = cwd || process.cwd();

    // Check for lock files to determine package manager
    if (existsSync(join(workingDir, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    
    if (existsSync(join(workingDir, 'yarn.lock'))) {
      return 'yarn';
    }
    
    // Default to npm
    return 'npm';
  }

  /**
   * Install packages
   */
  async install(
    packages: string[],
    cwd?: string,
    dev?: boolean,
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
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
   * Update packages
   */
  async update(
    packages?: string[],
    cwd?: string,
    packageManager: PackageManagerType = 'npm'
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
   * Remove packages
   */
  async remove(
    packages: string[],
    cwd?: string,
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
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
   * Check for outdated packages
   */
  async checkOutdated(
    cwd?: string,
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
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
   * Audit dependencies for vulnerabilities
   */
  async audit(
    cwd?: string,
    fix?: boolean,
    force?: boolean,
    production?: boolean,
    packageManager: PackageManagerType = 'npm'
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
   * Clean package manager cache
   */
  async cleanCache(
    cwd?: string,
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
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
   * Execute package manager command
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
   * Build install command arguments
   */
  private buildInstallArgs(
    packages: string[],
    dev?: boolean,
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
  ): string[] {
    const args: string[] = [];

    switch (packageManager) {
      case 'npm':
        args.push('install');
        if (global) args.push('--global');
        if (dev) args.push('--save-dev');
        break;
      case 'yarn':
        args.push('add');
        if (global) args.push('global');
        if (dev) args.push('--dev');
        break;
      case 'pnpm':
        args.push('add');
        if (global) args.push('--global');
        if (dev) args.push('--save-dev');
        break;
    }

    args.push(...packages);
    return args;
  }

  /**
   * Build update command arguments
   */
  private buildUpdateArgs(
    packages?: string[],
    packageManager: PackageManagerType = 'npm'
  ): string[] {
    const args: string[] = [];

    switch (packageManager) {
      case 'npm':
        args.push('update');
        break;
      case 'yarn':
        args.push('upgrade');
        break;
      case 'pnpm':
        args.push('update');
        break;
    }

    if (packages) {
      args.push(...packages);
    }

    return args;
  }

  /**
   * Build remove command arguments
   */
  private buildRemoveArgs(
    packages: string[],
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
  ): string[] {
    const args: string[] = [];

    switch (packageManager) {
      case 'npm':
        args.push('uninstall');
        if (global) args.push('--global');
        break;
      case 'yarn':
        args.push('remove');
        if (global) args.push('global');
        break;
      case 'pnpm':
        args.push('remove');
        if (global) args.push('--global');
        break;
    }

    args.push(...packages);
    return args;
  }

  /**
   * Build outdated command arguments
   */
  private buildOutdatedArgs(
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
  ): string[] {
    const args: string[] = ['outdated'];

    if (global) {
      switch (packageManager) {
        case 'npm':
          args.push('--global');
          break;
        case 'yarn':
          args.push('global');
          break;
        case 'pnpm':
          args.push('--global');
          break;
      }
    }

    return args;
  }

  /**
   * Build audit command arguments
   */
  private buildAuditArgs(
    fix?: boolean,
    force?: boolean,
    production?: boolean,
    packageManager: PackageManagerType = 'npm'
  ): string[] {
    const args: string[] = ['audit'];

    if (packageManager === 'npm') {
      if (fix) {
        args.push('fix');
        if (force) args.push('--force');
      }
      if (production) args.push('--production');
    } else if (packageManager === 'yarn') {
      // Yarn 1.x uses different audit syntax
      if (fix) {
        // Yarn doesn't have built-in fix, would need yarn-audit-fix
        console.warn('Yarn audit fix not directly supported, consider using yarn-audit-fix package');
      }
    } else if (packageManager === 'pnpm') {
      if (fix) {
        // pnpm audit doesn't have built-in fix
        console.warn('PNPM audit fix not directly supported');
      }
      if (production) args.push('--prod');
    }

    return args;
  }

  /**
   * Build cache clean command arguments
   */
  private buildCleanArgs(
    global?: boolean,
    packageManager: PackageManagerType = 'npm'
  ): string[] {
    switch (packageManager) {
      case 'npm':
        return ['cache', 'clean', '--force'];
      case 'yarn':
        return ['cache', 'clean'];
      case 'pnpm':
        return ['store', 'prune'];
      default:
        throw new Error(`Unknown package manager: ${packageManager}`);
    }
  }

  /**
   * Create error result
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