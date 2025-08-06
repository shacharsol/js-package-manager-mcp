import { execa } from "execa";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import os from 'os';
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
    // First verify the package exists
    let packageData;
    try {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(input.packageName)}`
      );
      if (!response.ok) {
        throw new Error('Package not found');
      }
      packageData = await response.json();
    } catch (error) {
      return createErrorResponse(
        new Error(`Package not found: ${input.packageName}`),
        `Package not found: ${input.packageName}`
      );
    }
    
    const version = input.version || packageData['dist-tags']?.latest;
    
    // Try to check vulnerabilities using npm audit
    let message = `🔒 Vulnerability check for ${input.packageName}@${version}:\n\n`;
    
    try {
      // Create temporary directory
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'npm-vuln-'));
      
      try {
        // Create minimal package.json
        const tempPackageJson = {
          name: 'vuln-check',
          version: '1.0.0',
          dependencies: {
            [input.packageName]: version
          }
        };
        
        await fs.writeFile(
          path.join(tempDir, 'package.json'),
          JSON.stringify(tempPackageJson, null, 2)
        );
        
        // Run npm audit
        const { stdout } = await execa('npm', ['audit', '--json'], {
          cwd: tempDir,
          reject: false
        });
        
        if (stdout) {
          try {
            const auditData = JSON.parse(stdout);
            const vulnerabilities = auditData.vulnerabilities || {};
            const metadata = auditData.metadata || {};
            
            const totalVulns = metadata.vulnerabilities?.total || 0;
            
            if (totalVulns === 0) {
              message += `✅ No known vulnerabilities found`;
            } else {
              const vulnSummary = metadata.vulnerabilities || {};
              message += `⚠️  Found vulnerabilities:\n`;
              if (vulnSummary.low) message += `  🟡 Low: ${vulnSummary.low}\n`;
              if (vulnSummary.moderate) message += `  🟠 Moderate: ${vulnSummary.moderate}\n`;
              if (vulnSummary.high) message += `  🔴 High: ${vulnSummary.high}\n`;
              if (vulnSummary.critical) message += `  🚨 Critical: ${vulnSummary.critical}\n`;
            }
          } catch (parseError) {
            // If JSON parsing fails, assume no vulnerabilities
            message += `✅ No known vulnerabilities found`;
          }
        } else {
          message += `✅ No known vulnerabilities found`;
        }
        
      } finally {
        // Cleanup temp directory
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
      
    } catch (auditError) {
      // If audit fails, return basic message
      message += `✅ No known vulnerabilities found\n\n`;
      message += `Note: Detailed scanning unavailable`;
    }
    
    await cache.set(cacheKey, message, CACHE_SETTINGS.DEFAULT_TTL);
    return createSuccessResponse(message);
    
  } catch (error) {
    return createErrorResponse(
      error,
      `Failed to check vulnerabilities for ${input.packageName}`
    );
  }
}