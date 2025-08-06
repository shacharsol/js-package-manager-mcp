import { execa } from "execa";
import { detectPackageManager } from "../pm-detect.js";
import { resolveProjectCwd } from "../utils/path-resolver.js";
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

/**
 * Execute npm command with idealTree error recovery
 */
async function executeNpmCommandWithRetry(
  command: string[],
  cwd: string,
  retries = 3
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await execa(command[0], command.slice(1), {
        cwd,
        env: {
          ...process.env,
          npm_config_legacy_peer_deps: 'true',
          npm_config_fund: 'false'
        }
      });
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.stderr || error.message || '';
      
      if (errorMessage.includes('Tracker "idealTree" already exists')) {
        // Clean npm cache and retry
        try {
          await execa('npm', ['cache', 'clean', '--force'], { cwd });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (cleanError) {
          // Ignore clean errors
        }
        
        if (attempt < retries) {
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}
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
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    const command = [packageManager, "install", ...input.packages];
    
    // Add flags
    if (input.dev) {
      command.push("--save-dev");
    }
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await executeNpmCommandWithRetry(command, resolvedCwd);
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
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    const command = [packageManager, "update"];
    
    if (input.packages) {
      command.push(...input.packages);
    }
    
    const { stdout } = await executeNpmCommandWithRetry(command, resolvedCwd);
    
    const target = input.packages ? formatList(input.packages) : 'all packages';
    return createSuccessResponse(`✅ Successfully updated ${target}\n\n${stdout}`);
  } catch (error) {
    const target = input.packages ? formatList(input.packages) : 'packages';
    return createErrorResponse(error, `Failed to update ${target}`);
  }
}

async function handleRemovePackages(args: unknown) {
  const input = RemovePackagesSchema.parse(args);
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    const command = [packageManager, "uninstall", ...input.packages];
    
    if (input.global) {
      command.push("--global");
    }
    
    const { stdout } = await executeNpmCommandWithRetry(command, resolvedCwd);
    
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
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
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
  } catch (error) {
    return createErrorResponse(error, 'Failed to check outdated packages');
  }
}