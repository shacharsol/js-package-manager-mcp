import { z } from "zod";
import { execa } from "execa";
import { detectPackageManager } from "../pm-detect.js";

const InstallPackagesSchema = z.object({
  packages: z.array(z.string()).describe("Array of package names (with optional versions)"),
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  dev: z.boolean().default(false).describe("Install as dev dependencies"),
  global: z.boolean().default(false).describe("Install globally")
});

const UpdatePackagesSchema = z.object({
  packages: z.array(z.string()).optional().describe("Specific packages to update (optional)"),
  cwd: z.string().default(process.cwd()).describe("Working directory")
});

const RemovePackagesSchema = z.object({
  packages: z.array(z.string()).describe("Array of package names to remove"),
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  global: z.boolean().default(false).describe("Remove global packages")
});

const CheckOutdatedSchema = z.object({
  cwd: z.string().default(process.cwd()).describe("Working directory"),
  global: z.boolean().default(false).describe("Check global packages")
});

// Export tools and handlers
export const tools = [
  {
    name: "install_packages",
    description: "Install npm packages in a project",
    inputSchema: InstallPackagesSchema
  },
  {
    name: "update_packages",
    description: "Update packages to their latest versions",
    inputSchema: UpdatePackagesSchema
  },
  {
    name: "remove_packages",
    description: "Remove packages from a project",
    inputSchema: RemovePackagesSchema
  },
  {
    name: "check_outdated",
    description: "Check for outdated packages",
    inputSchema: CheckOutdatedSchema
  }
];

export const handlers = new Map([
  ["install_packages", handleInstallPackages],
  ["update_packages", handleUpdatePackages],
  ["remove_packages", handleRemovePackages],
  ["check_outdated", handleCheckOutdated]
]);

async function handleInstallPackages(args: unknown) {
  const input = InstallPackagesSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = [packageManager, "install", ...input.packages];
    
    // Add flags
    if (input.dev) {
      command.push("--save-dev");
    }
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully installed packages: ${input.packages.join(', ')}\n\n${stdout}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to install packages: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleUpdatePackages(args: unknown) {
  const input = UpdatePackagesSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = [packageManager, "update"];
    
    if (input.packages) {
      command.push(...input.packages);
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully updated packages\n\n${stdout}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to update packages: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleRemovePackages(args: unknown) {
  const input = RemovePackagesSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = [packageManager, "uninstall", ...input.packages];
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Successfully removed packages: ${input.packages.join(', ')}\n\n${stdout}`
        }
      ]
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Failed to remove packages: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

async function handleCheckOutdated(args: unknown) {
  const input = CheckOutdatedSchema.parse(args);
  const { packageManager } = await detectPackageManager(input.cwd);
  
  try {
    const command = [packageManager, "outdated"];
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: input.cwd
    });
    
    return {
      content: [
        {
          type: "text",
          text: `📊 Outdated packages:\n\n${stdout}`
        }
      ]
    };
  } catch (error: any) {
    // npm outdated returns exit code 1 when packages are outdated
    if (error.stdout) {
      return {
        content: [
          {
            type: "text",
            text: `📊 Outdated packages:\n\n${error.stdout}`
          }
        ]
      };
    }
    
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