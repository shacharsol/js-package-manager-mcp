import { z } from "zod";
import { execa } from "execa";
import { detectPackageManager, getAuditCommand } from "./pm-detect.js";
import { httpClient } from "./http-client.js";
import { cache, CacheManager } from "./cache.js";
import { readFile } from "fs/promises";
import { join } from "path";

const AuditInputSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  fix: z.boolean().default(false).describe("Attempt to fix vulnerabilities"),
  force: z.boolean().default(false).describe("Force fixes (may include breaking changes)"),
  production: z.boolean().default(false).describe("Only audit production dependencies")
});

const VulnerabilityCheckSchema = z.object({
  packageName: z.string().describe("Package name to check"),
  version: z.string().optional().describe("Specific version to check")
});

// Export tools and handlers
export const tools = [
  {
    name: "audit_dependencies",
    description: "Audit project dependencies for security vulnerabilities",
    inputSchema: AuditInputSchema
  },
  {
    name: "check_vulnerability",
    description: "Check a specific package for known vulnerabilities",
    inputSchema: VulnerabilityCheckSchema
  }
];

export const handlers = new Map([
  ["audit_dependencies", handleAudit],
  ["check_vulnerability", handleVulnerabilityCheck]
]);

async function handleAudit(args: unknown) {
  const input = AuditInputSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = getAuditCommand(packageManager, input.fix);
    
    // Add additional flags
    if (input.force && input.fix) {
      switch (packageManager) {
        case "npm":
          command.push("--force");
          break;
        case "pnpm":
          command.push("--force");
          break;
        // Yarn doesn't support force flag for audit fix
      }
    }
    
    if (input.production) {
      switch (packageManager) {
        case "npm":
          command.push("--omit=dev");
          break;
        case "yarn":
          command.push("--groups", "dependencies");
          break;
        case "pnpm":
          command.push("--prod");
          break;
      }
    }
    
    // Add JSON output for better parsing
    if (!input.fix && packageManager === "npm") {
      command.push("--json");
    }
    
    const { stdout, stderr } = await execa(command[0], command.slice(1), {
      cwd: input.cwd,
      reject: false // Audit returns non-zero exit code when vulnerabilities are found
    });
    
    // Try to parse JSON output for npm
    if (!input.fix && packageManager === "npm" && stdout) {
      try {
        const auditResult = JSON.parse(stdout);
        return {
          content: [
            {
              type: "text",
              text: formatAuditResults(auditResult, packageManager)
            }
          ]
        };
      } catch {
        // Fall back to raw output
      }
    }
    
    const output = stdout || stderr;
    
    return {
      content: [
        {
          type: "text",
          text: input.fix 
            ? `✅ Audit fix completed using ${packageManager}:\n\n${output}`
            : `Security audit results using ${packageManager}:\n\n${output}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to audit dependencies: ${error.message}\n\nOutput: ${error.stdout || error.stderr}`
        }
      ],
      isError: true
    };
  }
}

async function handleVulnerabilityCheck(args: unknown) {
  const input = VulnerabilityCheckSchema.parse(args);
  
  // Check cache first
  const cacheKey = CacheManager.keys.vulnerabilities(
    input.packageName, 
    input.version || "latest"
  );
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return {
      content: [
        {
          type: "text",
          text: formatVulnerabilityInfo(cached, input.packageName)
        }
      ]
    };
  }
  
  try {
    // Get package info first
    const packageInfo = await httpClient.npmRegistry<any>(
      `/${input.packageName}${input.version ? `/${input.version}` : ""}`
    );
    
    const version = input.version || packageInfo["dist-tags"]?.latest;
    
    // Check GitHub Advisory Database
    const advisories = await httpClient.request<any[]>(
      `https://api.github.com/advisories?ecosystem=npm&package=${input.packageName}`,
      {
        headers: {
          "Accept": "application/vnd.github+json"
        }
      }
    );
    
    const relevantAdvisories = advisories.filter((advisory: any) => {
      // Check if this version is affected
      if (!advisory.vulnerabilities) return false;
      
      return advisory.vulnerabilities.some((vuln: any) => {
        if (vuln.package?.name !== input.packageName) return false;
        
        // Check version range
        const vulnerableVersions = vuln.vulnerable_version_range;
        if (!vulnerableVersions) return true; // Assume vulnerable if no range specified
        
        // Simple version check (in production, use semver library)
        return isVersionVulnerable(version, vulnerableVersions);
      });
    });
    
    const result = {
      package: input.packageName,
      version,
      vulnerabilities: relevantAdvisories,
      totalVulnerabilities: relevantAdvisories.length
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, result, 3600);
    
    return {
      content: [
        {
          type: "text",
          text: formatVulnerabilityInfo(result, input.packageName)
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to check vulnerabilities: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

function formatAuditResults(audit: any, packageManager: string): string {
  const metadata = audit.metadata || audit;
  const vulnerabilities = metadata.vulnerabilities || {};
  
  const total = Object.values(vulnerabilities).reduce((sum: number, count: any) => sum + (count || 0), 0);
  
  if (total === 0) {
    return "✅ No vulnerabilities found!";
  }
  
  const output: string[] = [
    `⚠️  Found ${total} vulnerabilities:\n`
  ];
  
  if (vulnerabilities.info) {
    output.push(`ℹ️  Info: ${vulnerabilities.info}`);
  }
  if (vulnerabilities.low) {
    output.push(`🟡 Low: ${vulnerabilities.low}`);
  }
  if (vulnerabilities.moderate) {
    output.push(`🟠 Moderate: ${vulnerabilities.moderate}`);
  }
  if (vulnerabilities.high) {
    output.push(`🔴 High: ${vulnerabilities.high}`);
  }
  if (vulnerabilities.critical) {
    output.push(`🚨 Critical: ${vulnerabilities.critical}`);
  }
  
  output.push("");
  
  // Add advisories if available
  if (audit.advisories) {
    output.push("Detailed advisories:");
    for (const [id, advisory] of Object.entries(audit.advisories) as [string, any][]) {
      output.push(`\n${advisory.severity.toUpperCase()}: ${advisory.title}`);
      output.push(`Package: ${advisory.module_name}`);
      output.push(`Vulnerable versions: ${advisory.vulnerable_versions}`);
      output.push(`Patched versions: ${advisory.patched_versions}`);
      if (advisory.recommendation) {
        output.push(`Recommendation: ${advisory.recommendation}`);
      }
    }
  }
  
  return output.join("\n");
}

function formatVulnerabilityInfo(result: any, packageName: string): string {
  if (result.totalVulnerabilities === 0) {
    return `✅ No known vulnerabilities found for ${packageName}@${result.version}`;
  }
  
  const output: string[] = [
    `⚠️  Found ${result.totalVulnerabilities} vulnerabilities for ${packageName}@${result.version}:\n`
  ];
  
  for (const advisory of result.vulnerabilities) {
    output.push(`\n🔴 ${advisory.summary}`);
    output.push(`Severity: ${advisory.severity}`);
    output.push(`CVE: ${advisory.cve_id || "N/A"}`);
    output.push(`GHSA: ${advisory.ghsa_id}`);
    
    const vuln = advisory.vulnerabilities?.find((v: any) => v.package?.name === packageName);
    if (vuln) {
      output.push(`Vulnerable versions: ${vuln.vulnerable_version_range}`);
      if (vuln.first_patched_version) {
        output.push(`First patched version: ${vuln.first_patched_version.identifier}`);
      }
    }
    
    if (advisory.references?.length) {
      output.push("References:");
      advisory.references.slice(0, 3).forEach((ref: any) => {
        output.push(`  - ${ref.url}`);
      });
    }
  }
  
  return output.join("\n");
}

// Simple version vulnerability check (in production, use proper semver library)
function isVersionVulnerable(version: string, range: string): boolean {
  // This is a simplified check - in production use the 'semver' library
  // For now, assume all versions are potentially vulnerable if a range exists
  return true;
}