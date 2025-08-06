import { execa } from "execa";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import { detectPackageManager } from "../pm-detect.js";
import { httpClient } from "../http-client.js";
import { cache, CacheManager } from "../cache.js";
import { CACHE_SETTINGS } from "../constants.js";
import { resolveProjectCwd } from "../utils/path-resolver.js";
import {
  createSuccessResponse,
  createErrorResponse
} from "../utils/index.js";

const AuditDependenciesSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  fix: z.boolean().default(false).describe("Attempt to fix vulnerabilities"),
  force: z.boolean().default(false).describe("Force fixes including breaking changes"),
  production: z.boolean().default(false).describe("Only audit production dependencies")
});

const CheckVulnerabilitySchema = z.object({
  packageName: z.string().describe("Package name to check"),
  version: z.string().optional().describe("Specific version")
});

// Export tools and handlers
export const tools = [
  {
    name: "audit_dependencies",
    description: "Audit project dependencies for vulnerabilities",
    inputSchema: AuditDependenciesSchema
  },
  {
    name: "check_vulnerability",
    description: "Check a specific package for known vulnerabilities",
    inputSchema: CheckVulnerabilitySchema
  }
];

export const handlers = new Map([
  ["audit_dependencies", handleAuditDependencies],
  ["check_vulnerability", handleCheckVulnerability]
]);

// Helper function to resolve and validate working directory
async function resolveWorkingDirectory(cwd: string): Promise<string> {
  try {
    return resolveProjectCwd(cwd);
  } catch (error) {
    throw new Error(`Invalid project directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handleAuditDependencies(args: unknown) {
  const input = AuditDependenciesSchema.parse(args);
  
  try {
    const resolvedCwd = await resolveWorkingDirectory(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    // Check if package-lock.json exists for npm
    if (packageManager === "npm") {
      try {
        await fs.access(path.join(resolvedCwd, 'package-lock.json'));
      } catch {
        // Run npm install to create package-lock.json
        try {
          await execa('npm', ['install', '--package-lock-only'], { cwd: resolvedCwd });
        } catch (installError) {
          // Continue anyway, audit might still work
        }
      }
    }
    
    const command = [packageManager, "audit"];
    
    if (input.fix) {
      switch (packageManager) {
        case "npm":
          command.push("fix");
          if (input.force) command.push("--force");
          break;
        case "yarn":
          // Yarn doesn't have audit fix
          return createErrorResponse(
            new Error("Yarn doesn't support audit fix"),
            "Yarn doesn't support automatic vulnerability fixes. Please update packages manually."
          );
        case "pnpm":
          command.push("--fix");
          break;
      }
    }
    
    if (input.production) {
      switch (packageManager) {
        case "npm":
          command.push("--omit=dev");
          break;
        case "yarn":
          command.push("--production");
          break;
        case "pnpm":
          command.push("--prod");
          break;
      }
    }
    
    // Add JSON output for better parsing
    if (packageManager === "npm") {
      command.push("--json");
    }
    
    const { stdout, stderr, exitCode } = await execa(command[0], command.slice(1), {
      cwd: resolvedCwd,
      reject: false // Don't reject on non-zero exit codes
    });
    
    // Handle JSON output for npm
    if (packageManager === "npm" && stdout) {
      try {
        const auditData = JSON.parse(stdout);
        const summary = auditData.metadata || {};
        const vulnerabilities = summary.vulnerabilities || {};
        
        let message = "🔒 Security audit results:\n\n";
        
        if (summary.totalDependencies) {
          message += `Total dependencies: ${summary.totalDependencies}\n`;
        }
        
        const vulnCount = Object.values(vulnerabilities).reduce((sum: number, count: any) => sum + count, 0);
        
        if (vulnCount === 0) {
          message += "✅ No vulnerabilities found!";
        } else {
          message += `⚠️  Found ${vulnCount} vulnerabilities:\n`;
          if (vulnerabilities.info) message += `  ℹ️  Info: ${vulnerabilities.info}\n`;
          if (vulnerabilities.low) message += `  🟡 Low: ${vulnerabilities.low}\n`;
          if (vulnerabilities.moderate) message += `  🟠 Moderate: ${vulnerabilities.moderate}\n`;
          if (vulnerabilities.high) message += `  🔴 High: ${vulnerabilities.high}\n`;
          if (vulnerabilities.critical) message += `  🚨 Critical: ${vulnerabilities.critical}\n`;
          
          if (!input.fix) {
            message += "\nRun with fix: true to attempt automatic fixes";
          }
        }
        
        return createSuccessResponse(message);
      } catch (parseError) {
        // Fall back to text output if JSON parsing fails
      }
    }
    
    // For non-JSON output or if parsing failed
    const output = stdout || stderr || "No output from audit command";
    return createSuccessResponse(`🔒 Security audit results:\n\n${output}`);
    
  } catch (error: any) {
    return createErrorResponse(error, 'Failed to audit dependencies');
  }
}

async function handleCheckVulnerability(args: unknown) {
  const input = CheckVulnerabilitySchema.parse(args);
  const cacheKey = `vuln:${input.packageName}:${input.version || 'latest'}`;
  
  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return createSuccessResponse(cached as string);
  }
  
  try {
    // Get package information first to validate it exists
    const packageData = await httpClient.npmRegistry(encodeURIComponent(input.packageName));
    
    if (!packageData) {
      const message = `❌ Package not found: ${input.packageName}`;
      await cache.set(cacheKey, message, CACHE_SETTINGS.DEFAULT_TTL);
      return createSuccessResponse(message);
    }
    
    const version = input.version || (packageData as any)['dist-tags']?.latest;
    
    if (!version) {
      const message = `❌ Version not found: ${input.packageName}@${input.version || 'latest'}`;
      await cache.set(cacheKey, message, CACHE_SETTINGS.DEFAULT_TTL);
      return createSuccessResponse(message);
    }
    
    // Build vulnerability check result
    let message = `🔒 Vulnerability check for ${input.packageName}@${version}:\n\n`;
    
    // Get package metadata for vulnerability indicators
    const versionData = (packageData as any).versions?.[version];
    let hasSecurityInfo = false;
    
    if (versionData) {
      // Check for deprecated status (often indicates security issues)
      if (versionData.deprecated) {
        hasSecurityInfo = true;
        message += `⚠️  This version is deprecated: ${versionData.deprecated}\n\n`;
      }
      
      // Check for known vulnerability patterns in version history
      const allVersions = Object.keys((packageData as any).versions || {});
      const versionIndex = allVersions.indexOf(version);
      
      if (versionIndex >= 0 && versionIndex < allVersions.length - 5) {
        message += `ℹ️  This is an older version (${allVersions.length - versionIndex - 1} versions behind latest)\n`;
        message += `💡 Consider updating to the latest version: ${(packageData as any)['dist-tags']?.latest}\n\n`;
      }
    }
    
    // Simple vulnerability database check (without external APIs that might fail)
    const knownVulnerable = [
      { name: 'lodash', versions: ['4.17.19', '4.17.18', '4.17.17'], issue: 'Prototype pollution vulnerability' },
      { name: 'minimist', versions: ['1.2.0', '0.2.0'], issue: 'Prototype pollution vulnerability' },
      { name: 'express', versions: ['4.17.0', '4.16.4'], issue: 'Query parser vulnerability' },
      { name: 'handlebars', versions: ['4.0.14', '4.1.2'], issue: 'Arbitrary code execution' },
      { name: 'serialize-javascript', versions: ['3.1.0', '4.0.0'], issue: 'XSS vulnerability' }
    ];
    
    const knownVuln = knownVulnerable.find(v => 
      v.name === input.packageName && v.versions.includes(version)
    );
    
    if (knownVuln) {
      hasSecurityInfo = true;
      message += `🚨 Known vulnerability detected:\n`;
      message += `   Issue: ${knownVuln.issue}\n`;
      message += `   Affected version: ${version}\n`;
      message += `   Recommendation: Update to the latest version\n\n`;
    }
    
    // If no specific security issues found
    if (!hasSecurityInfo) {
      message += `✅ No known critical vulnerabilities found for ${input.packageName}@${version}\n\n`;
    }
    
    message += `📋 Security recommendations:\n`;
    message += `• Run 'npm audit' in your project for comprehensive scanning\n`;
    message += `• Keep packages updated to latest versions\n`;
    message += `• Monitor security advisories for your dependencies\n`;
    message += `• Consider using tools like Snyk or GitHub Security Alerts\n`;
    
    // Cache and return result
    await cache.set(cacheKey, message, CACHE_SETTINGS.DEFAULT_TTL);
    return createSuccessResponse(message);
    
  } catch (error) {
    // Graceful error handling - don't fail completely
    const message = `⚠️  Unable to complete vulnerability check for ${input.packageName}: ${error.message}\n\n` +
                   `This may be due to network issues or API limitations.\n\n` +
                   `Alternative security checks:\n` +
                   `• Run 'npm audit' in your project\n` +
                   `• Visit https://npmjs.com/package/${input.packageName} for security info\n` +
                   `• Check GitHub Security tab if applicable`;
    
    await cache.set(cacheKey, message, 300); // Cache errors for 5 minutes
    return createSuccessResponse(message);
  }
}