import { z } from 'zod';
import {
  PackageArraySchema,
  WorkingDirectorySchema,
  SearchQuerySchema,
  PaginationSchema,
  BooleanFlagSchema,
  PackageSpecSchema
} from './package.js';

/**
 * Tool input validation schemas
 */

/**
 * Search packages tool schema
 */
export const SearchPackagesSchema = z.object({
  query: SearchQuerySchema.describe('Search query string'),
  ...PaginationSchema.shape,
  includeUnstable: BooleanFlagSchema.describe('Include pre-release versions')
});

/**
 * Package info tool schema
 */
export const PackageInfoSchema = z.object({
  packageName: PackageSpecSchema.describe('Package name (with optional version)'),
  includeVersions: BooleanFlagSchema.describe('Include version history'),
  includeDependencies: BooleanFlagSchema.describe('Include dependency information')
});

/**
 * Install packages tool schema
 */
export const InstallPackagesSchema = z.object({
  packages: PackageArraySchema.describe('Array of package names (with optional versions)'),
  cwd: WorkingDirectorySchema.describe('Working directory'),
  dev: BooleanFlagSchema.describe('Install as dev dependencies'),
  global: BooleanFlagSchema.describe('Install globally'),
  save: BooleanFlagSchema.default(true).describe('Save to package.json'),
  exact: BooleanFlagSchema.describe('Install exact versions')
});

/**
 * Update packages tool schema
 */
export const UpdatePackagesSchema = z.object({
  packages: z.array(PackageSpecSchema).optional().describe('Specific packages to update (optional)'),
  cwd: WorkingDirectorySchema.describe('Working directory'),
  global: BooleanFlagSchema.describe('Update global packages'),
  latest: BooleanFlagSchema.describe('Update to latest versions (ignoring semver)'),
  interactive: BooleanFlagSchema.describe('Interactive update mode')
});

/**
 * Remove packages tool schema
 */
export const RemovePackagesSchema = z.object({
  packages: PackageArraySchema.describe('Array of package names to remove'),
  cwd: WorkingDirectorySchema.describe('Working directory'),
  global: BooleanFlagSchema.describe('Remove global packages'),
  save: BooleanFlagSchema.default(true).describe('Remove from package.json')
});

/**
 * Check outdated tool schema
 */
export const CheckOutdatedSchema = z.object({
  cwd: WorkingDirectorySchema.describe('Working directory'),
  global: BooleanFlagSchema.describe('Check global packages'),
  depth: z.number().int().min(0).max(10).default(0).describe('Dependency depth to check')
});

/**
 * Audit dependencies tool schema
 */
export const AuditDependenciesSchema = z.object({
  cwd: WorkingDirectorySchema.describe('Working directory'),
  production: BooleanFlagSchema.describe('Only audit production dependencies'),
  dev: BooleanFlagSchema.describe('Only audit development dependencies'),
  fix: BooleanFlagSchema.describe('Automatically fix vulnerabilities'),
  force: BooleanFlagSchema.describe('Force fixes even if breaking changes')
});

/**
 * Bundle size analysis tool schema
 */
export const BundleSizeSchema = z.object({
  packages: PackageArraySchema.describe('Array of package names to analyze'),
  includeGzip: BooleanFlagSchema.default(true).describe('Include gzipped size'),
  includePeers: BooleanFlagSchema.describe('Include peer dependencies in calculation')
});

/**
 * Dependency tree tool schema
 */
export const DependencyTreeSchema = z.object({
  cwd: WorkingDirectorySchema.describe('Working directory'),
  package: z.string().optional().describe('Specific package to analyze (optional)'),
  depth: z.number().int().min(0).max(10).default(3).describe('Maximum depth to traverse'),
  production: BooleanFlagSchema.describe('Only show production dependencies'),
  dev: BooleanFlagSchema.describe('Only show development dependencies')
});

/**
 * License analysis tool schema
 */
export const LicenseAnalysisSchema = z.object({
  cwd: WorkingDirectorySchema.describe('Working directory'),
  production: BooleanFlagSchema.describe('Only analyze production dependencies'),
  includeDevDeps: BooleanFlagSchema.describe('Include development dependencies'),
  format: z.enum(['table', 'json', 'csv']).default('table').describe('Output format')
});

/**
 * Circular dependency detection schema
 */
export const CircularDependencySchema = z.object({
  cwd: WorkingDirectorySchema.describe('Working directory'),
  exclude: z.array(z.string()).default([]).describe('Patterns to exclude from analysis'),
  includeNodeModules: BooleanFlagSchema.describe('Include node_modules in analysis')
});