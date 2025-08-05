import { execa } from "execa";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import { detectPackageManager } from "../pm-detect.js";
import { httpClient } from "../http-client.js";
import { cache, CacheManager } from "../cache.js";
import { CACHE_SETTINGS } from "../constants.js";
import {
  createSuccessResponse,
  createErrorResponse
} from "../utils/index.js";

const DependencyTreeSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  depth: z.number().default(3).describe("Maximum depth of tree"),
  production: z.boolean().default(false).describe("Only show production dependencies")
});

const BundleSizeSchema = z.object({
  packageName: z.string().describe("Package name to analyze"),
  version: z.string().optional().describe("Specific version (default: latest)")
});

const AnalyzeDependenciesSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  circular: z.boolean().default(true).describe("Check for circular dependencies"),
  orphans: z.boolean().default(true).describe("Check for orphaned files")
});

const DownloadStatsSchema = z.object({
  packageName: z.string().describe("Package name"),
  period: z.enum(["last-day", "last-week", "last-month", "last-year"])
    .default("last-month")
    .describe("Time period for statistics")
});

// Export tools and handlers
export const tools = [
  {
    name: "dependency_tree",
    description: "Display the dependency tree of a project",
    inputSchema: DependencyTreeSchema
  },
  {
    name: "check_bundle_size",
    description: "Check the bundle size of a package before installing",
    inputSchema: BundleSizeSchema
  },
  {
    name: "analyze_dependencies",
    description: "Analyze project dependencies for issues like circular dependencies",
    inputSchema: AnalyzeDependenciesSchema
  },
  {
    name: "download_stats",
    description: "Get download statistics for a package",
    inputSchema: DownloadStatsSchema
  }
];

export const handlers = new Map([
  ["dependency_tree", handleDependencyTree],
  ["check_bundle_size", handleBundleSize],
  ["analyze_dependencies", handleAnalyzeDependencies],
  ["download_stats", handleDownloadStats]
]);

// Helper function to resolve and validate working directory
async function resolveWorkingDirectory(cwd: string): Promise<string> {
  const resolvedCwd = path.resolve(cwd === "." || cwd === "/" ? process.cwd() : cwd);
  
  // Verify the directory exists
  try {
    const stats = await fs.stat(resolvedCwd);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${resolvedCwd}`);
    }
    
    // Check if package.json exists
    await fs.access(path.join(resolvedCwd, 'package.json'));
  } catch (error) {
    throw new Error(`Invalid project directory or missing package.json: ${resolvedCwd}`);
  }
  
  return resolvedCwd;
}

async function handleDependencyTree(args: unknown) {
  const input = DependencyTreeSchema.parse(args);
  
  try {
    const resolvedCwd = await resolveWorkingDirectory(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    const command = [packageManager, "list"];
    
    // Add depth flag
    switch (packageManager) {
      case "npm":
        command.push(`--depth=${input.depth}`);
        if (input.production) command.push("--omit=dev");
        break;
      case "yarn":
        command.push(`--depth=${input.depth}`);
        if (input.production) command.push("--production");
        break;
      case "pnpm":
        command.push(`--depth=${input.depth}`);
        if (input.production) command.push("--prod");
        break;
    }
    
    const { stdout, stderr } = await execa(command[0], command.slice(1), {
      cwd: resolvedCwd,
      reject: false
    });
    
    const output = stdout || stderr || "Unable to generate dependency tree";
    
    // Check if output is empty or just shows the root package
    if (output.trim().split('\n').length <= 3) {
      // Try alternative command for npm
      if (packageManager === "npm") {
        const altResult = await execa('npm', ['ls', '--all'], {
          cwd: resolvedCwd,
          reject: false
        });
        if (altResult.stdout) {
          return createSuccessResponse(`Dependency tree (depth: ${input.depth}):\n\n${altResult.stdout}`);
        }
      }
      
      return createSuccessResponse(`Dependency tree (depth: ${input.depth}):\n\n${output}\n\nNote: This project may have no dependencies or the tree may be empty.`);
    }
    
    return createSuccessResponse(`Dependency tree (depth: ${input.depth}):\n\n${output}`);
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to generate dependency tree');
  }
}

async function handleBundleSize(args: unknown) {
  const input = BundleSizeSchema.parse(args);
  const cacheKey = `bundle:${input.packageName}:${input.version || 'latest'}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return createSuccessResponse(cached as string);
  }
  
  try {
    // Try bundlephobia API first
    const bundlephobiaUrl = `https://bundlephobia.com/api/size?package=${encodeURIComponent(input.packageName)}${input.version ? `@${input.version}` : ''}`;
    
    try {
      const response = await fetch(bundlephobiaUrl, {
        headers: {
          'User-Agent': 'npmplus-mcp-server'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const formatSize = (bytes: number) => {
          const kb = bytes / 1024;
          return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
        };
        
        let message = `📦 Bundle Size Analysis for ${input.packageName}@${data.version}:\n\n`;
        message += `📏 Minified: ${formatSize(data.size)}\n`;
        message += `🗜️  Gzipped: ${formatSize(data.gzip)}\n`;
        
        if (data.hasJSModule !== undefined) {
          message += `📦 ES Modules: ${data.hasJSModule ? '✅ Yes' : '❌ No'}\n`;
        }
        
        if (data.hasSideEffects !== undefined) {
          message += `⚡ Side Effects: ${data.hasSideEffects ? '⚠️  Yes' : '✅ No'}\n`;
        }
        
        await cache.set(cacheKey, message, CACHE_SETTINGS.LONG_TTL);
        return createSuccessResponse(message);
      }
    } catch (bundlephobiaError) {
      // Fall back to npm registry data
    }
    
    // Fallback to npm registry
    const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(input.packageName)}`;
    const packageData = await httpClient.npmRegistry(encodeURIComponent(input.packageName));
    
    if (!packageData) {
      return createErrorResponse(
        new Error(`Package not found: ${input.packageName}`),
        `Package not found: ${input.packageName}`
      );
    }
    
    const version = input.version || (packageData as any)['dist-tags']?.latest;
    const versionData = (packageData as any).versions?.[version];
    
    if (!versionData) {
      return createErrorResponse(
        new Error(`Version not found: ${input.packageName}@${input.version}`),
        `Version not found: ${input.packageName}@${input.version}`
      );
    }
    
    const dist = versionData.dist || {};
    let message = `📦 Bundle Size Analysis for ${input.packageName}@${version}:\n\n`;
    
    if (dist.unpackedSize) {
      const kb = dist.unpackedSize / 1024;
      const size = kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
      message += `📏 Unpacked Size: ${size}\n`;
    }
    
    if (dist.fileCount) {
      message += `📁 File Count: ${dist.fileCount}\n`;
    }
    
    message += `\nNote: For more detailed bundle analysis, consider using bundlephobia.com`;
    
    await cache.set(cacheKey, message, CACHE_SETTINGS.LONG_TTL);
    return createSuccessResponse(message);
    
  } catch (error) {
    return createErrorResponse(error, `Failed to analyze bundle size for ${input.packageName}`);
  }
}

async function handleAnalyzeDependencies(args: unknown) {
  const input = AnalyzeDependenciesSchema.parse(args);
  
  try {
    const resolvedCwd = await resolveWorkingDirectory(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    let message = "📊 Dependency Analysis:\n\n";
    let hasIssues = false;
    
    // Read package.json
    const packageJsonPath = path.join(resolvedCwd, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    // Check for circular dependencies using npm ls
    if (input.circular && packageManager === "npm") {
      try {
        const { stdout, stderr } = await execa('npm', ['ls', '--json'], {
          cwd: resolvedCwd,
          reject: false
        });
        
        if (stdout) {
          const depsData = JSON.parse(stdout);
          
          // Look for circular dependencies in the problems array
          if (depsData.problems && depsData.problems.length > 0) {
            const circularDeps = depsData.problems.filter((problem: string) => 
              problem.includes('circular')
            );
            
            if (circularDeps.length > 0) {
              hasIssues = true;
              message += `🔄 Circular Dependencies Found:\n`;
              circularDeps.forEach((dep: string) => {
                message += `  • ${dep}\n`;
              });
              message += '\n';
            }
          }
        }
      } catch (circularError) {
        // Continue with other checks
      }
    }
    
    // Check for missing dependencies
    try {
      const { stderr } = await execa(packageManager, ['list'], {
        cwd: resolvedCwd,
        reject: false
      });
      
      if (stderr && stderr.includes('missing:')) {
        hasIssues = true;
        const missingDeps = stderr.match(/missing: [^\n]+/g) || [];
        if (missingDeps.length > 0) {
          message += `❌ Missing Dependencies:\n`;
          missingDeps.forEach(dep => {
            message += `  • ${dep.replace('missing: ', '')}\n`;
          });
          message += '\n';
        }
      }
    } catch (missingError) {
      // Continue with other checks
    }
    
    // Check for unused dependencies (basic check)
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    const allDeps = [...dependencies, ...devDependencies];
    
    if (input.orphans) {
      if (allDeps.length > 0) {
        message += `📦 Dependency Summary:\n`;
        message += `  • Production dependencies: ${dependencies.length}\n`;
        message += `  • Dev dependencies: ${devDependencies.length}\n`;
        message += `  • Total: ${allDeps.length}\n\n`;
        
        message += `💡 Tips:\n`;
        message += `  • Run 'npm dedupe' to optimize dependency tree\n`;
        message += `  • Use 'npm prune' to remove extraneous packages\n`;
        message += `  • Consider using 'npm-check' for more detailed analysis\n`;
      }
    }
    
    if (!hasIssues && allDeps.length === 0) {
      message += "✅ No dependency issues found!";
    } else if (!hasIssues) {
      message += "✅ No circular dependencies or missing packages detected!";
    }
    
    return createSuccessResponse(message);
    
  } catch (error) {
    return createErrorResponse(error, 'Failed to analyze dependencies');
  }
}

async function handleDownloadStats(args: unknown) {
  const input = DownloadStatsSchema.parse(args);
  const cacheKey = `stats:${input.packageName}:${input.period}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return createSuccessResponse(cached as string);
  }
  
  try {
    // npm download stats API
    const statsUrl = `https://api.npmjs.org/downloads/point/${input.period}/${encodeURIComponent(input.packageName)}`;
    const response = await fetch(statsUrl);
    
    if (!response.ok) {
      return createErrorResponse(
        new Error(`Failed to fetch download stats for ${input.packageName}`),
        `Could not retrieve download statistics for ${input.packageName}`
      );
    }
    
    const data = await response.json();
    
    let message = `📊 Download Statistics for ${input.packageName}:\n\n`;
    message += `📅 Period: ${input.period}\n`;
    message += `📥 Downloads: ${data.downloads.toLocaleString()}\n`;
    
    if (data.start && data.end) {
      message += `📆 Date Range: ${data.start} to ${data.end}\n`;
    }
    
    // Calculate daily average
    const days = {
      'last-day': 1,
      'last-week': 7,
      'last-month': 30,
      'last-year': 365
    };
    
    const avgDaily = Math.round(data.downloads / days[input.period]);
    message += `📈 Daily Average: ${avgDaily.toLocaleString()}`;
    
    await cache.set(cacheKey, message, CACHE_SETTINGS.SHORT_TTL);
    return createSuccessResponse(message);
    
  } catch (error) {
    return createErrorResponse(error, `Failed to fetch download stats for ${input.packageName}`);
  }
}