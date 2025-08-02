import { z } from 'zod';

/**
 * Common package-related validation schemas
 */

/**
 * Package name validation
 */
export const PackageNameSchema = z
  .string()
  .min(1, 'Package name cannot be empty')
  .max(214, 'Package name too long')
  .regex(
    /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
    'Invalid package name format'
  );

/**
 * Semver version validation
 */
export const VersionSchema = z
  .string()
  .regex(
    /^(?:\^|~|>=?|<=?|=)?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?:[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    'Invalid version format'
  );

/**
 * Package with optional version
 */
export const PackageSpecSchema = z
  .string()
  .refine(
    (spec) => {
      const parts = spec.split('@');
      if (parts.length === 1) {
        // Just package name
        return PackageNameSchema.safeParse(spec).success;
      }
      if (parts.length === 2) {
        // package@version
        const [name, version] = parts;
        return (
          PackageNameSchema.safeParse(name).success &&
          VersionSchema.safeParse(version).success
        );
      }
      if (parts.length === 3 && parts[0] === '') {
        // @scope/package@version
        const [, scopedName, version] = parts;
        return (
          PackageNameSchema.safeParse(`@${scopedName}`).success &&
          VersionSchema.safeParse(version).success
        );
      }
      return false;
    },
    'Invalid package specification format'
  );

/**
 * Array of package names
 */
export const PackageArraySchema = z
  .array(PackageSpecSchema)
  .min(1, 'At least one package must be specified')
  .max(50, 'Too many packages specified at once');

/**
 * Working directory validation
 */
export const WorkingDirectorySchema = z
  .string()
  .min(1, 'Working directory cannot be empty')
  .default(process.cwd());

/**
 * Search query validation
 */
export const SearchQuerySchema = z
  .string()
  .min(1, 'Search query cannot be empty')
  .max(100, 'Search query too long')
  .trim();

/**
 * Pagination parameters
 */
export const PaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(25),
  from: z
    .number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0)
});

/**
 * Common boolean flags
 */
export const BooleanFlagSchema = z.boolean().default(false);

/**
 * Dependency type validation
 */
export const DependencyTypeSchema = z.enum([
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
]).default('dependencies');