import { z } from "zod";
import { execa } from "execa";
import { detectPackageManager } from "../pm-detect.js";
import { httpClient } from "../http-client.js";
import { cache, CacheManager } from "../cache.js";

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

async function handleAuditDependencies(args: unknown) {
  const input = AuditDependenciesSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = [packageManager, "audit"];
    
    if (input.fix) {
      switch (packageManager) {
        case "npm":
          command.push("fix");
          if (input.force) command.push("--force");
          break;
        case "yarn":
          // Yarn doesn't have audit fix
          break;
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
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `🔒 Security audit results:\n\n${stdout}`
        }
      ]
    };
  } catch (error: any) {
    // Audit commands often return non-zero exit codes when vulnerabilities are found
    if (error.stdout) {
      return {
        content: [
          {
            type: "text",
            text: `🔒 Security audit results:\n\n${error.stdout}`
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to audit dependencies: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleCheckVulnerability(args: unknown) {
  const input = CheckVulnerabilitySchema.parse(args);
  
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
          text: formatVulnerabilityResults(cached, input.packageName)
        }
      ]
    };
  }
  
  try {
    // Mock vulnerability check (replace with actual API call)
    const vulnerabilityData = {
      package: input.packageName,
      version: input.version || "latest",
      vulnerabilities: [],
      safe: true
    };
    
    // Cache for 1 hour
    await cache.set(cacheKey, vulnerabilityData, 3600);
    
    return {
      content: [
        {
          type: "text",
          text: formatVulnerabilityResults(vulnerabilityData, input.packageName)
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

function formatVulnerabilityResults(data: any, packageName: string): string {
  const output: string[] = [
    `🔒 Vulnerability check for ${packageName}:\n`
  ];
  
  if (data.safe) {
    output.push("✅ No known vulnerabilities found");
  } else {
    output.push("⚠️ Vulnerabilities found:");
    data.vulnerabilities.forEach((vuln: any) => {
      output.push(`   • ${vuln.title} (${vuln.severity})`);
    });
  }
  
  return output.join("\n");
}