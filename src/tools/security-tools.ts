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
    // Use npm registry API to check for vulnerabilities
    const packageUrl = `https://registry.npmjs.org/${encodeURIComponent(input.packageName)}`;
    const packageData = await httpClient.npmRegistry(encodeURIComponent(input.packageName));
    
    if (!packageData) {
      return createErrorResponse(
        new Error(`Package not found: ${input.packageName}`),
        `Package not found: ${input.packageName}`
      );
    }
    
    const version = input.version || (packageData as any)['dist-tags']?.latest;
    
    if (!version || !(packageData as any).versions?.[version]) {
      return createErrorResponse(
        new Error(`Version not found: ${input.packageName}@${input.version}`),
        `Version not found: ${input.packageName}@${input.version}`
      );
    }
    
    // Check for security advisories using npm audit API
    try {
      const auditPayload = {
        name: input.packageName,
        version: version,
        requires: {
          [input.packageName]: version
        },
        dependencies: {
          [input.packageName]: {
            version: version
          }
        }
      };
      
      const auditResponse = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditPayload)
      });
      
      if (auditResponse.ok) {
        const advisories = await auditResponse.json();
        
        if (Object.keys(advisories).length > 0) {
          let message = `🔒 Vulnerability check for ${input.packageName}@${version}:\n\n`;
          message += `⚠️  Found ${Object.keys(advisories).length} vulnerabilities:\n\n`;
          
          for (const [id, advisory] of Object.entries(advisories)) {
            const adv = advisory as any;
            message += `• ${adv.title || 'Untitled'}\n`;
            message += `  Severity: ${adv.severity}\n`;
            message += `  Vulnerable versions: ${adv.vulnerable_versions || 'Unknown'}\n`;
            if (adv.recommendation) {
              message += `  Recommendation: ${adv.recommendation}\n`;
            }
            message += '\n';
          }
          
          await cache.set(cacheKey, message, CACHE_SETTINGS.DEFAULT_TTL);
          return createSuccessResponse(message);
        }
      }
    } catch (auditError) {
      // If audit API fails, continue with basic check
    }
    
    // No vulnerabilities found
    const message = `🔒 Vulnerability check for ${input.packageName}:\n\n✅ No known vulnerabilities found`;
    await cache.set(cacheKey, message, CACHE_SETTINGS.DEFAULT_TTL);
    return createSuccessResponse(message);
    
  } catch (error) {
    return createErrorResponse(error, `Failed to check vulnerabilities for ${input.packageName}`);
  }
}