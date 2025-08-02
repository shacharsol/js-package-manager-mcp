import { z } from "zod";
import { execa } from "execa";
import { detectPackageManager, getInstallCommand, getUpdateCommand, getRemoveCommand } from "./pm-detect.js";
import { readFile } from "fs/promises";
import { join } from "path";

const InstallInputSchema = z.object({
  packages: z.array(z.string()).describe("Package names to install (with optional versions)"),
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  dev: z.boolean().default(false).describe("Install as dev dependencies"),
  global: z.boolean().default(false).describe("Install globally")
});

const UpdateInputSchema = z.object({
  packages: z.array(z.string()).optional().describe("Specific packages to update (empty for all)"),
  cwd: z.string().default(process.cwd()).describe("Working directory")
});

const RemoveInputSchema = z.object({
  packages: z.array(z.string()).describe("Package names to remove"),
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  global: z.boolean().default(false).describe("Remove global packages")
});

const OutdatedInputSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  global: z.boolean().default(false).describe("Check global packages")
});

async function handleInstall(args: unknown) {
  const input = InstallInputSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = getInstallCommand(packageManager, input.packages);
    
    // Add flags
    if (input.dev) {
      switch (packageManager) {
        case "npm":
          command.push("--save-dev");
          break;
        case "yarn":
          command.push("--dev");
          break;
        case "pnpm":
          command.push("--save-dev");
          break;
      }
    }
    
    if (input.global) {
      command.splice(1, 0, "-g");
    }
    
    const { stdout, stderr } = await execa(command[0], command.slice(1), {
      cwd: input.cwd,
      reject: false
    });
    
    const output = stdout || stderr;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully installed packages using ${packageManager}:\n\n${output}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to install packages: ${error.message}\n\nOutput: ${error.stdout || error.stderr}`
        }
      ],
      isError: true
    };
  }
}

async function handleUpdate(args: unknown) {
  const input = UpdateInputSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = getUpdateCommand(packageManager, input.packages || []);
    
    const { stdout, stderr } = await execa(command[0], command.slice(1), {
      cwd: input.cwd,
      reject: false
    });
    
    const output = stdout || stderr;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully updated packages using ${packageManager}:\n\n${output}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to update packages: ${error.message}\n\nOutput: ${error.stdout || error.stderr}`
        }
      ],
      isError: true
    };
  }
}

async function handleRemove(args: unknown) {
  const input = RemoveInputSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = getRemoveCommand(packageManager, input.packages);
    
    if (input.global) {
      command.splice(1, 0, "-g");
    }
    
    const { stdout, stderr } = await execa(command[0], command.slice(1), {
      cwd: input.cwd,
      reject: false
    });
    
    const output = stdout || stderr;
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully removed packages using ${packageManager}:\n\n${output}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to remove packages: ${error.message}\n\nOutput: ${error.stdout || error.stderr}`
        }
      ],
      isError: true
    };
  }
}

async function handleOutdated(args: unknown) {
  const input = OutdatedInputSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = [packageManager, "outdated"];
    
    if (input.global) {
      command.push("-g");
    }
    
    // Add JSON output for better parsing (where supported)
    if (packageManager === "npm") {
      command.push("--json");
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd,
      reject: false // npm outdated returns non-zero exit code when packages are outdated
    });
    
    if (packageManager === "npm" && stdout) {
      try {
        const outdated = JSON.parse(stdout);
        return {
          content: [
            {
              type: "text",
              text: formatOutdatedPackages(outdated)
            }
          ]
        };
      } catch {
        // Fall back to raw output if JSON parsing fails
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: stdout || "All packages are up to date!"
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to check outdated packages: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

function formatOutdatedPackages(outdated: Record<string, any>): string {
  const packages = Object.entries(outdated);
  
  if (packages.length === 0) {
    return "✅ All packages are up to date!";
  }
  
  const output: string[] = [`Found ${packages.length} outdated packages:\n`];
  
  for (const [name, info] of packages) {
    output.push(`📦 ${name}`);
    output.push(`   Current: ${info.current}`);
    output.push(`   Wanted: ${info.wanted}`);
    output.push(`   Latest: ${info.latest}`);
    output.push(`   Type: ${info.type || 'dependencies'}`);
    if (info.dependent) {
      output.push(`   Dependent: ${info.dependent}`);
    }
    output.push("");
  }
  
  return output.join("\n");
}

// Export tools and handlers
export const tools = [
  {
    name: "install_packages",
    description: "Install npm packages in a project",
    inputSchema: InstallInputSchema
  },
  {
    name: "update_packages",
    description: "Update npm packages to their latest versions",
    inputSchema: UpdateInputSchema
  },
  {
    name: "remove_packages",
    description: "Remove npm packages from a project",
    inputSchema: RemoveInputSchema
  },
  {
    name: "check_outdated",
    description: "Check for outdated packages in a project",
    inputSchema: OutdatedInputSchema
  }
];

export const handlers = new Map([
  ["install_packages", handleInstall],
  ["update_packages", handleUpdate],
  ["remove_packages", handleRemove],
  ["check_outdated", handleOutdated]
]);