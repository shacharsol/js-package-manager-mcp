import { PACKAGE_MANAGERS } from './constants.js';
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
export declare function detectPackageManager(cwd?: string): Promise<DetectionResult>;
export declare function getInstallCommand(pm: PackageManager, packages?: string[]): string[];
export declare function getUpdateCommand(pm: PackageManager, packages?: string[]): string[];
export declare function getRemoveCommand(pm: PackageManager, packages: string[]): string[];
export declare function getAuditCommand(pm: PackageManager, fix?: boolean): string[];
//# sourceMappingURL=pm-detect.d.ts.map