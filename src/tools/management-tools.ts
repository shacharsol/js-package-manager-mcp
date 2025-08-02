import { z } from "zod";
import { execa } from "execa";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { detectPackageManager } from "../pm-detect.js";
import { httpClient } from "../http-client.js";
import { CacheService } from '../services/CacheService.js';
import { PackageService } from '../services/PackageService.js';
import { PackageManagerService } from '../services/PackageManagerService.js';
import { URLS } from '../constants.js';

const ListLicensesSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  production: z.boolean().default(false).describe("Only check production dependencies"),
  summary: z.boolean().default(true).describe("Show summary of license types")
});

const CheckLicenseSchema = z.object({
  packageName: z.string().describe("Package name to check"),
  version: z.string().optional().describe("Specific version to check")
});

const CleanCacheSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  global: z.boolean().default(false).describe("Clean global cache")
});

const PackageInfoSchema = z.object({
  packageName: z.string().describe("Package name"),
  version: z.string().optional().describe("Specific version")
});

// Export tools and handlers
export const tools = [
  {
    name: "list_licenses",
    description: "List licenses of all dependencies in a project",
    inputSchema: ListLicensesSchema
  },
  {
    name: "check_license",
    description: "Check the license of a specific package",
    inputSchema: CheckLicenseSchema
  },
  {
    name: "clean_cache",
    description: "Clean the package manager cache",
    inputSchema: CleanCacheSchema
  },
  {
    name: "package_info",
    description: "Get detailed information about a package",
    inputSchema: PackageInfoSchema
  }
];

export const handlers = new Map([
  ["list_licenses", handleListLicenses],
  ["check_license", handleCheckLicense],
  ["clean_cache", handleCleanCache],
  ["package_info", handlePackageInfo]
]);

async function handleListLicenses(args: unknown) {
  const input = ListLicensesSchema.parse(args);
  
  try {
    // Read package.json and lock file to get all dependencies
    const packageJson = JSON.parse(
      await readFile(join(input.cwd, "package.json"), "utf-8")
    );
    
    const dependencies = {
      ...(input.production ? {} : packageJson.devDependencies || {}),
      ...(packageJson.dependencies || {})
    };
    
    const licenses: Record<string, string[]> = {};
    const packageLicenses: Array<{ name: string; version: string; license: string }> = [];
    
    // Get license info for each dependency
    for (const [name, version] of Object.entries(dependencies)) {
      try {
        // Try to read from node_modules first
        const packagePath = join(input.cwd, "node_modules", name, "package.json");
        const pkgData = JSON.parse(await readFile(packagePath, "utf-8"));
        
        const license = pkgData.license || pkgData.licenses || "Unknown";
        const licenseStr = typeof license === "object" 
          ? (Array.isArray(license) ? license.map(l => l.type || l).join(", ") : license.type || "Unknown")
          : license;
        
        packageLicenses.push({
          name,
          version: pkgData.version,
          license: licenseStr
        });
        
        // Group by license type
        if (!licenses[licenseStr]) {
          licenses[licenseStr] = [];
        }
        licenses[licenseStr].push(`${name}@${pkgData.version}`);
      } catch {
        // Package not installed locally, skip
      }
    }
    
    const output: string[] = ["📜 License Report:\n"];
    
    if (input.summary) {
      output.push("License Summary:");
      for (const [license, packages] of Object.entries(licenses)) {
        output.push(`\n${license}: ${packages.length} packages`);
        if (packages.length <= 5) {
          packages.forEach(pkg => output.push(`  - ${pkg}`));
        } else {
          packages.slice(0, 3).forEach(pkg => output.push(`  - ${pkg}`));
          output.push(`  ... and ${packages.length - 3} more`);
        }
      }
    } else {
      output.push("All Packages:");
      packageLicenses.sort((a, b) => a.name.localeCompare(b.name));
      packageLicenses.forEach(({ name, version, license }) => {
        output.push(`${name}@${version}: ${license}`);
      });
    }
    
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
          text: `❌ Failed to list licenses: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleCheckLicense(args: unknown) {
  const input = CheckLicenseSchema.parse(args);
  
  try {
    const packageInfo = await httpClient.npmRegistry<any>(
      `/${input.packageName}${input.version ? `/${input.version}` : ""}`
    );
    
    const version = input.version || packageInfo["dist-tags"]?.latest;
    const versionData = packageInfo.versions?.[version] || packageInfo;
    
    const output: string[] = [
      `📜 License Information for ${input.packageName}@${version}:\n`
    ];
    
    // License info
    const license = versionData.license || versionData.licenses;
    if (license) {
      const licenseStr = typeof license === "object"
        ? (Array.isArray(license) ? license.map(l => l.type || l).join(", ") : license.type || "Unknown")
        : license;
      output.push(`License: ${licenseStr}`);
    } else {
      output.push("License: Not specified");
    }
    
    // Check for license file in repository
    if (versionData.repository?.url) {
      output.push(`\nRepository: ${versionData.repository.url}`);
    }
    
    // Author info
    if (versionData.author) {
      const author = typeof versionData.author === "object"
        ? `${versionData.author.name}${versionData.author.email ? ` <${versionData.author.email}>` : ""}`
        : versionData.author;
      output.push(`Author: ${author}`);
    }
    
    // Maintainers
    if (versionData.maintainers?.length) {
      output.push("\nMaintainers:");
      versionData.maintainers.forEach((m: any) => {
        output.push(`  - ${m.name}${m.email ? ` <${m.email}>` : ""}`);
      });
    }
    
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
          text: `❌ Failed to check license: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleCleanCache(args: unknown) {
  const input = CleanCacheSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    let command: string[];
    
    switch (packageManager) {
      case "npm":
        command = ["npm", "cache", "clean", "--force"];
        break;
      case "yarn":
        command = ["yarn", "cache", "clean"];
        break;
      case "pnpm":
        command = ["pnpm", "store", "prune"];
        break;
    }
    
    if (input.global && packageManager === "npm") {
      command.push("-g");
    }
    
    const { stdout, stderr } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Cache cleaned successfully using ${packageManager}:\n\n${stdout || stderr || "Cache cleaned"}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to clean cache: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handlePackageInfo(args: unknown) {
  const input = PackageInfoSchema.parse(args);
  
  try {
    const packageInfo = await httpClient.npmRegistry<any>(
      `/${input.packageName}${input.version ? `/${input.version}` : ""}`
    );
    
    const version = input.version || packageInfo["dist-tags"]?.latest;
    const versionData = packageInfo.versions?.[version] || packageInfo;
    
    const output: string[] = [
      `📦 Package Information for ${input.packageName}@${version}:\n`
    ];
    
    // Basic info
    output.push(`Name: ${versionData.name}`);
    output.push(`Version: ${versionData.version}`);
    output.push(`Description: ${versionData.description || "No description"}`);
    
    // License
    const license = versionData.license || "Not specified";
    output.push(`License: ${typeof license === "object" ? license.type || "Unknown" : license}`);
    
    // Author
    if (versionData.author) {
      const author = typeof versionData.author === "object"
        ? versionData.author.name
        : versionData.author;
      output.push(`Author: ${author}`);
    }
    
    // Keywords
    if (versionData.keywords?.length) {
      output.push(`Keywords: ${versionData.keywords.join(", ")}`);
    }
    
    // Dependencies count
    const deps = Object.keys(versionData.dependencies || {}).length;
    const devDeps = Object.keys(versionData.devDependencies || {}).length;
    output.push(`\nDependencies: ${deps}`);
    output.push(`Dev Dependencies: ${devDeps}`);
    
    // Dist tags
    if (packageInfo["dist-tags"]) {
      output.push("\nDist Tags:");
      for (const [tag, ver] of Object.entries(packageInfo["dist-tags"])) {
        output.push(`  ${tag}: ${ver}`);
      }
    }
    
    // Links
    output.push("\nLinks:");
    if (versionData.homepage) {
      output.push(`  Homepage: ${versionData.homepage}`);
    }
    if (versionData.repository?.url) {
      output.push(`  Repository: ${versionData.repository.url}`);
    }
    if (versionData.bugs?.url) {
      output.push(`  Issues: ${versionData.bugs.url}`);
    }
    output.push(`  NPM: ${URLS.NPM_WEBSITE}/package/${input.packageName}`);
    
    // Time info
    if (packageInfo.time?.[version]) {
      output.push(`\nPublished: ${new Date(packageInfo.time[version]).toLocaleDateString()}`);
    }
    
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
          text: `❌ Failed to get package info: ${error.message}`
        }
      ],
      isError: true
    };
  }
}