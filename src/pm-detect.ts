import { existsSync } from 'fs';
import { access, readFile } from 'fs/promises';
import { join } from 'path';
import { PACKAGE_MANAGERS } from './constants.js';
import { execa } from "execa";

/**
 * Supported package managers for JavaScript projects.
 * 
 * @typedef {('npm'|'yarn'|'pnpm')} PackageManager
 */
export type PackageManager = typeof PACKAGE_MANAGERS[keyof typeof PACKAGE_MANAGERS];

/**
 * Result of package manager detection for a project directory.
 * 
 * @interface DetectionResult
 * @example
 * ```typescript
 * const result: DetectionResult = {
 *   packageManager: "npm",
 *   lockFile: "/path/to/package-lock.json",
 *   version: "8.19.2"
 * };
 * ```
 */
export interface DetectionResult {
  packageManager: PackageManager;
  lockFile: string | null;
  version: string | null;
}

export async function detectPackageManager(cwd: string = process.cwd()): Promise<DetectionResult> {
  // Check for lock files
  const lockFiles: Record<PackageManager, string> = {
    [PACKAGE_MANAGERS.PNPM]: "pnpm-lock.yaml",
    [PACKAGE_MANAGERS.YARN]: "yarn.lock",
    [PACKAGE_MANAGERS.NPM]: "package-lock.json"
  };
  
  for (const [pm, lockFile] of Object.entries(lockFiles) as [PackageManager, string][]) {
    try {
      await access(join(cwd, lockFile));
      const version = await getPackageManagerVersion(pm);
      return { 
        packageManager: pm, 
        lockFile: join(cwd, lockFile),
        version 
      };
    } catch {
      // Continue checking
    }
  }
  
  // Check for package manager configuration files
  try {
    await access(join(cwd, ".npmrc"));
    const version = await getPackageManagerVersion(PACKAGE_MANAGERS.NPM);
    return { packageManager: PACKAGE_MANAGERS.NPM, lockFile: null, version };
  } catch {}
  
  try {
    await access(join(cwd, ".yarnrc.yml"));
    const version = await getPackageManagerVersion(PACKAGE_MANAGERS.YARN);
    return { packageManager: PACKAGE_MANAGERS.YARN, lockFile: null, version };
  } catch {}
  
  // Check packageManager field in package.json
  try {
    const packageJson = JSON.parse(
      await readFile(join(cwd, "package.json"), "utf-8")
    );
    
    if (packageJson.packageManager) {
      const [pm] = packageJson.packageManager.split("@");
      if ([PACKAGE_MANAGERS.NPM, PACKAGE_MANAGERS.YARN, PACKAGE_MANAGERS.PNPM].includes(pm)) {
        const version = await getPackageManagerVersion(pm as PackageManager);
        return { 
          packageManager: pm as PackageManager, 
          lockFile: null,
          version 
        };
      }
    }
  } catch {}
  
  // Default to npm
  const version = await getPackageManagerVersion(PACKAGE_MANAGERS.NPM);
  return { packageManager: PACKAGE_MANAGERS.NPM, lockFile: null, version };
}

async function getPackageManagerVersion(pm: PackageManager): Promise<string | null> {
  try {
    const { stdout } = await execa(pm, ["--version"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

export function getInstallCommand(pm: PackageManager, packages: string[] = []): string[] {
  if (packages.length === 0) {
    // Install all dependencies
    return [pm, "install"];
  }
  
  switch (pm) {
    case PACKAGE_MANAGERS.NPM:
      return [PACKAGE_MANAGERS.NPM, "install", ...packages];
    case PACKAGE_MANAGERS.YARN:
      return [PACKAGE_MANAGERS.YARN, "add", ...packages];
    case PACKAGE_MANAGERS.PNPM:
      return [PACKAGE_MANAGERS.PNPM, "add", ...packages];
  }
}

export function getUpdateCommand(pm: PackageManager, packages: string[] = []): string[] {
  if (packages.length === 0) {
    // Update all dependencies
    switch (pm) {
      case PACKAGE_MANAGERS.NPM:
        return [PACKAGE_MANAGERS.NPM, "update"];
      case PACKAGE_MANAGERS.YARN:
        return [PACKAGE_MANAGERS.YARN, "upgrade"];
      case PACKAGE_MANAGERS.PNPM:
        return [PACKAGE_MANAGERS.PNPM, "update"];
    }
  }
  
  switch (pm) {
    case PACKAGE_MANAGERS.NPM:
      return [PACKAGE_MANAGERS.NPM, "update", ...packages];
    case PACKAGE_MANAGERS.YARN:
      return [PACKAGE_MANAGERS.YARN, "upgrade", ...packages];
    case PACKAGE_MANAGERS.PNPM:
      return [PACKAGE_MANAGERS.PNPM, "update", ...packages];
  }
}

export function getRemoveCommand(pm: PackageManager, packages: string[]): string[] {
  switch (pm) {
    case PACKAGE_MANAGERS.NPM:
      return [PACKAGE_MANAGERS.NPM, "uninstall", ...packages];
    case PACKAGE_MANAGERS.YARN:
      return [PACKAGE_MANAGERS.YARN, "remove", ...packages];
    case PACKAGE_MANAGERS.PNPM:
      return [PACKAGE_MANAGERS.PNPM, "remove", ...packages];
  }
}

export function getAuditCommand(pm: PackageManager, fix: boolean = false): string[] {
  const baseCmd = [pm, "audit"];
  
  if (fix) {
    switch (pm) {
      case PACKAGE_MANAGERS.NPM:
        return [...baseCmd, "fix"];
      case PACKAGE_MANAGERS.YARN:
        return [PACKAGE_MANAGERS.YARN, "audit", "--fix"]; // Note: Yarn's audit fix is limited
      case PACKAGE_MANAGERS.PNPM:
        return [...baseCmd, "--fix"];
    }
  }
  
  return baseCmd;
}