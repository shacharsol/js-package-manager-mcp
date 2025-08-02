import { z } from "zod";
import { execa } from "execa";
import madge from "madge";
import { readFile } from "fs/promises";
import { join } from "path";
import { detectPackageManager } from "../pm-detect.js";
import { httpClient } from "../http-client.js";
import { cache, CacheManager } from "../cache.js";

const DependencyTreeSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  depth: z.number().min(0).max(10).default(3).describe("Maximum depth of tree"),
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
  period: z.enum(["last-day", "last-week", "last-month", "last-year"]).default("last-month").describe("Time period for statistics")
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

async function handleDependencyTree(args: unknown) {
  const input = DependencyTreeSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
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
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `Dependency tree (depth: ${input.depth}):\n\n${stdout}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to generate dependency tree: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleBundleSize(args: unknown) {
  const input = BundleSizeSchema.parse(args);
  
  // Check cache first
  const cacheKey = CacheManager.keys.bundleSize(
    input.packageName,
    input.version || "latest"
  );
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: "text",
          text: formatBundleSize(cached)
        }
      ]
    };
  }
  
  try {
    // Try bundlephobia first
    const packageSpec = `${input.packageName}${input.version ? `@${input.version}` : ""}`;
    
    try {
      const bundleData = await httpClient.bundlephobia(packageSpec);
      
      // Cache for 1 hour
      await cache.set(cacheKey, bundleData, 3600);
      
      return {
        content: [
          {
            type: "text",
            text: formatBundleSize(bundleData)
          }
        ]
      };
    } catch {
      // Fallback to packagephobia for install size
      const installData = await httpClient.packagephobia(input.packageName);
      
      // Cache for 1 hour
      await cache.set(cacheKey, installData, 3600);
      
      return {
        content: [
          {
            type: "text",
            text: formatInstallSize(installData)
          }
        ]
      };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to check bundle size: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleAnalyzeDependencies(args: unknown) {
  const input = AnalyzeDependenciesSchema.parse(args);
  
  try {
    // Read package.json to get entry point
    const packageJsonPath = join(input.cwd, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    const entryPoint = packageJson.main || "index.js";
    
    // Use madge to analyze dependencies
    const res = await madge(join(input.cwd, entryPoint), {
      baseDir: input.cwd,
      includeNpm: true,
      fileExtensions: ["js", "jsx", "ts", "tsx"],
      detectiveOptions: {
        es6: {
          mixedImports: true
        },
        ts: {
          mixedImports: true,
          skipTypeImports: true
        }
      }
    });
    
    const output: string[] = [];
    
    // Check for circular dependencies
    if (input.circular) {
      const circular = res.circular();
      if (circular.length > 0) {
        output.push("⚠️  Circular dependencies found:");
        circular.forEach((cycle) => {
          output.push(`   ${cycle.join(" → ")} → ${cycle[0]}`);
        });
        output.push("");
      } else {
        output.push("✅ No circular dependencies found");
        output.push("");
      }
    }
    
    // Check for orphaned files
    if (input.orphans) {
      const orphans = res.orphans();
      if (orphans.length > 0) {
        output.push("📁 Orphaned files (not imported by any other file):");
        orphans.forEach((file) => {
          output.push(`   ${file}`);
        });
        output.push("");
      } else {
        output.push("✅ No orphaned files found");
        output.push("");
      }
    }
    
    // Get dependency summary
    const dependencies = res.obj();
    const fileCount = Object.keys(dependencies).length;
    const totalDeps = Object.values(dependencies).reduce((sum: number, deps: any) => sum + deps.length, 0);
    
    output.push("📊 Dependency Summary:");
    output.push(`   Total files analyzed: ${fileCount}`);
    output.push(`   Total dependencies: ${totalDeps}`);
    output.push(`   Average dependencies per file: ${(totalDeps / fileCount).toFixed(1)}`);
    
    return {
      content: [
        {
          type: "text",
          text: output.join("\n")
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to analyze dependencies: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleDownloadStats(args: unknown) {
  const input = DownloadStatsSchema.parse(args);
  
  // Check cache first
  const cacheKey = CacheManager.keys.downloads(input.packageName, input.period);
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: "text",
          text: formatDownloadStats(cached, input.packageName, input.period)
        }
      ]
    };
  }
  
  try {
    const stats = await httpClient.npmApi<any>(
      `/downloads/point/${input.period}/${input.packageName}`
    );
    
    // Cache for 1 hour
    await cache.set(cacheKey, stats, 3600);
    
    return {
      content: [
        {
          type: "text",
          text: formatDownloadStats(stats, input.packageName, input.period)
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to fetch download statistics: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

function formatBundleSize(data: any): string {
  const output: string[] = [
    `📦 Bundle Size Analysis for ${data.name}@${data.version}:\n`
  ];
  
  output.push(`📏 Minified: ${formatBytes(data.size)}`);
  output.push(`🗜️  Gzipped: ${formatBytes(data.gzip)}`);
  
  if (data.dependencyCount) {
    output.push(`📚 Dependencies: ${data.dependencyCount}`);
  }
  
  if (data.hasJSModule !== undefined) {
    output.push(`📦 ES Modules: ${data.hasJSModule ? "✅ Yes" : "❌ No"}`);
  }
  
  if (data.hasSideEffects !== undefined) {
    output.push(`⚡ Side Effects: ${data.hasSideEffects ? "⚠️  Yes" : "✅ No (tree-shakeable)"}`);
  }
  
  return output.join("\n");
}

function formatInstallSize(data: any): string {
  const output: string[] = [
    `📦 Install Size Analysis for ${data.name}@${data.version}:\n`
  ];
  
  output.push(`💾 Install Size: ${formatBytes(data.install.bytes)}`);
  output.push(`📁 Unpacked Size: ${formatBytes(data.publish.bytes)}`);
  output.push(`📊 Files: ${data.publish.files}`);
  
  return output.join("\n");
}

function formatDownloadStats(stats: any, packageName: string, period: string): string {
  const output: string[] = [
    `📊 Download Statistics for ${packageName}:\n`
  ];
  
  output.push(`📅 Period: ${period}`);
  output.push(`📥 Downloads: ${stats.downloads.toLocaleString()}`);
  
  if (stats.start && stats.end) {
    output.push(`📆 Date Range: ${stats.start} to ${stats.end}`);
  }
  
  // Calculate daily average
  const days = {
    "last-day": 1,
    "last-week": 7,
    "last-month": 30,
    "last-year": 365
  };
  
  const avgDaily = Math.round(stats.downloads / days[period as keyof typeof days]);
  output.push(`📈 Daily Average: ${avgDaily.toLocaleString()}`);
  
  return output.join("\n");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}