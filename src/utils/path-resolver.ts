import { resolve, isAbsolute } from 'path';
import { existsSync, statSync } from 'fs';

/**
 * Resolves a directory path, handling relative paths like "." properly
 * 
 * @param cwd - The directory path that might be relative
 * @returns Absolute path to the directory
 * @throws Error if the path doesn't exist or isn't a directory
 */
export function resolveCwd(cwd: string): string {
  let resolvedPath: string;
  
  // Handle special case of "." which should be current working directory
  if (cwd === '.') {
    resolvedPath = process.cwd();
  } else if (isAbsolute(cwd)) {
    resolvedPath = cwd;
  } else {
    // Resolve relative paths against current working directory
    resolvedPath = resolve(process.cwd(), cwd);
  }
  
  // Validate that the path exists and is a directory
  if (!existsSync(resolvedPath)) {
    throw new Error(`Invalid project directory: ${resolvedPath} (does not exist)`);
  }
  
  const stat = statSync(resolvedPath);
  if (!stat.isDirectory()) {
    throw new Error(`Invalid project directory: ${resolvedPath} (not a directory)`);
  }
  
  return resolvedPath;
}

/**
 * Validates that a directory contains a package.json file
 * 
 * @param cwd - The directory path to check
 * @returns True if package.json exists
 */
export function isNodeProject(cwd: string): boolean {
  const resolvedPath = resolveCwd(cwd);
  return existsSync(resolve(resolvedPath, 'package.json'));
}

/**
 * Resolves and validates a Node.js project directory
 * 
 * @param cwd - The directory path that should contain a Node.js project
 * @returns Absolute path to the project directory
 * @throws Error if not a valid Node.js project directory
 */
export function resolveProjectCwd(cwd: string): string {
  const resolvedPath = resolveCwd(cwd);
  
  if (!isNodeProject(resolvedPath)) {
    throw new Error(`Invalid project directory: ${resolvedPath} (no package.json found)`);
  }
  
  return resolvedPath;
}