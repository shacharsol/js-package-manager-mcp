import { execa } from "execa";
import { detectPackageManager } from "../pm-detect.js";
import { 
  InstallPackagesSchema, 
  UpdatePackagesSchema, 
  RemovePackagesSchema, 
  CheckOutdatedSchema 
} from "../validators/index.js";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withErrorHandling,
  formatList 
} from "../utils/index.js";

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
  const resolvedCwd = input.cwd === "." ? process.cwd() : input.cwd;
  const { packageManager } = await detectPackageManager(resolvedCwd);
  
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
      cwd: resolvedCwd
    });
    
    const packageList = formatList(input.packages);
    return createSuccessResponse(
      `✅ Successfully installed ${packageList}\n\n${stdout}`
    );
  } catch (error) {
    return createErrorResponse(error, `Failed to install ${formatList(input.packages)}`);
  }
}

async function handleUpdatePackages(args: unknown) {
  const input = UpdatePackagesSchema.parse(args);
  const resolvedCwd = input.cwd === "." ? process.cwd() : input.cwd;
  const { packageManager } = await detectPackageManager(resolvedCwd);
  
  try {
    const command = [packageManager, "update"];
    
    if (input.packages) {
      command.push(...input.packages);
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: resolvedCwd
    });
    
    const target = input.packages ? formatList(input.packages) : 'all packages';
    return createSuccessResponse(`✅ Successfully updated ${target}\n\n${stdout}`);
  } catch (error) {
    const target = input.packages ? formatList(input.packages) : 'packages';
    return createErrorResponse(error, `Failed to update ${target}`);
  }
}

async function handleRemovePackages(args: unknown) {
  const input = RemovePackagesSchema.parse(args);
  const resolvedCwd = input.cwd === "." ? process.cwd() : input.cwd;
  const { packageManager } = await detectPackageManager(resolvedCwd);
  
  try {
    const command = [packageManager, "uninstall", ...input.packages];
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: resolvedCwd
    });
    
    const packageList = formatList(input.packages);
    return createSuccessResponse(
      `✅ Successfully removed ${packageList}\n\n${stdout}`
    );
  } catch (error) {
    return createErrorResponse(error, `Failed to remove ${formatList(input.packages)}`);
  }
}

async function handleCheckOutdated(args: unknown) {
  const input = CheckOutdatedSchema.parse(args);
  const resolvedCwd = input.cwd === "." ? process.cwd() : input.cwd;
  const { packageManager } = await detectPackageManager(resolvedCwd);
  
  try {
    const command = [packageManager, "outdated"];
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await execa(command[0], command.slice(1), {
      cwd: resolvedCwd
    });
    
    return createSuccessResponse(`📊 Outdated packages:\n\n${stdout}`);
  } catch (error: any) {
    // npm outdated returns exit code 1 when packages are outdated
    if (error.stdout) {
      return createSuccessResponse(`📊 Outdated packages:\n\n${error.stdout}`);
    }
    
    return createErrorResponse(error, 'Failed to check outdated packages');
  }
}