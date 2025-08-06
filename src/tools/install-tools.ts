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

// Define consistent return type
type ToolResult = {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
};

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
      console.error(`[npmplus-mcp] Attempt ${attempt}/${retries}: ${command.join(' ')}`);
      
      return await execa(command[0], command.slice(1), {
        cwd,
        env: {
          ...process.env,
          npm_config_legacy_peer_deps: 'true',
          npm_config_fund: 'false',
          NO_UPDATE_NOTIFIER: '1',
          NPM_CONFIG_UPDATE_NOTIFIER: 'false'
        }
      });
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.stderr || error.message || '';
      
      if (errorMessage.includes('Tracker "idealTree" already exists')) {
        console.error(`[npmplus-mcp] idealTree error detected, cleaning cache...`);
        
        // Clean npm cache and retry
        try {
          await execa('npm', ['cache', 'clean', '--force'], { cwd });
          // Kill any hanging npm processes
          await execa('pkill', ['-f', 'npm install'], { reject: false });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
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

// Type the handlers Map properly
export const handlers = new Map<string, (args: unknown) => Promise<ToolResult>>([
  ["install_packages", handleInstallPackages],
  ["update_packages", handleUpdatePackages],
  ["remove_packages", handleRemovePackages],
  ["check_outdated", handleCheckOutdated]
]);

async function handleInstallPackages(args: unknown): Promise<ToolResult> {
  const input = InstallPackagesSchema.parse(args);
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager, lockFile } = await detectPackageManager(resolvedCwd);
    
    // Build install command based on package manager
    let command: string[];
    
    switch (packageManager) {
      case "npm":
        command = ["npm", "install"];
        if (input.dev) command.push("--save-dev");
        if (input.exact) command.push("--save-exact");
        if (input.global) command.push("-g");
        command.push(...input.packages);
        break;
        
      case "yarn":
        command = ["yarn", "add"];
        if (input.dev) command.push("--dev");
        if (input.exact) command.push("--exact");
        if (input.global) command.push("global");
        command.push(...input.packages);
        break;
        
      case "pnpm":
        command = ["pnpm", "add"];
        if (input.dev) command.push("--save-dev");
        if (input.exact) command.push("--save-exact");
        if (input.global) command.push("--global");
        command.push(...input.packages);
        break;
    }
    
    // Use the retry function
    const result = await executeNpmCommandWithRetry(command, resolvedCwd);
    
    // Parse the output to get installed packages info
    const installedPackages: string[] = [];
    const output = result.stdout;
    
    // Different package managers have different output formats
    if (packageManager === "npm") {
      // npm lists added packages like: + package@version
      const addedMatches = output.matchAll(/\+ (.+@[\d.]+)/g);
      for (const match of addedMatches) {
        installedPackages.push(match[1]);
      }
    } else if (packageManager === "yarn") {
      // yarn lists as: success Saved 1 new dependency.
      // info Direct dependencies
      // └─ package@version
      const depMatches = output.matchAll(/└─ (.+@[\d.]+)/g);
      for (const match of depMatches) {
        installedPackages.push(match[1]);
      }
    } else if (packageManager === "pnpm") {
      // pnpm lists as: + package@version
      const addedMatches = output.matchAll(/\+ (.+@[\d.]+)/g);
      for (const match of addedMatches) {
        installedPackages.push(match[1]);
      }
    }
    
    // If we couldn't parse specific packages, at least confirm installation
    if (installedPackages.length === 0) {
      installedPackages.push(...input.packages);
    }
    
    const successMessage = `✅ Successfully installed ${installedPackages.length} package(s) using ${packageManager}:\n\n${installedPackages.map(pkg => `• ${pkg}`).join('\n')}\n\nLocation: ${resolvedCwd}`;
    
    return createSuccessResponse(successMessage);
    
  } catch (error: any) {
    console.error(`[npmplus-mcp] Install error:`, error.message);
    
    // Provide helpful error messages
    let errorMessage = `Failed to install ${input.packages.join(', ')}: ${error.message}`;
    
    if (error.message?.includes('Tracker "idealTree" already exists')) {
      errorMessage += '\n\nThis is a known npm issue. Try:\n';
      errorMessage += '1. Running "npm cache clean --force"\n';
      errorMessage += '2. Closing other terminal windows running npm\n';
      errorMessage += '3. Waiting a moment and trying again';
    } else if (error.message?.includes('EACCES')) {
      errorMessage += '\n\nPermission denied. If installing globally, you may need to:\n';
      errorMessage += '1. Use sudo (not recommended)\n';
      errorMessage += '2. Configure npm to use a different directory\n';
      errorMessage += '3. Use a Node version manager like nvm';
    } else if (error.message?.includes('E404')) {
      errorMessage += '\n\nPackage not found. Please check:\n';
      errorMessage += '1. Package name is spelled correctly\n';
      errorMessage += '2. Package exists on npm registry';
    }
    
    return createErrorResponse(error, errorMessage);
  }
}

async function handleUpdatePackages(args: unknown): Promise<ToolResult> {
  const input = UpdatePackagesSchema.parse(args);
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    let command: string[];
    
    switch (packageManager) {
      case "npm":
        command = ["npm", "update"];
        if (input.latest) command.push("--latest");
        break;
      case "yarn":
        command = ["yarn", "upgrade"];
        if (input.latest) command.push("--latest");
        if (input.interactive) command.push("--interactive");
        break;
      case "pnpm":
        command = ["pnpm", "update"];
        if (input.latest) command.push("--latest");
        if (input.interactive) command.push("--interactive");
        break;
    }
    
    if (input.global) {
      command.push(packageManager === "yarn" ? "global" : "--global");
    }
    
    if (input.packages && input.packages.length > 0) {
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

async function handleRemovePackages(args: unknown): Promise<ToolResult> {
  const input = RemovePackagesSchema.parse(args);
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    let command: string[];
    
    switch (packageManager) {
      case "npm":
        command = ["npm", "uninstall", ...input.packages];
        if (input.global) command.push("-g");
        if (input.save !== false) command.push("--save");
        break;
      case "yarn":
        command = ["yarn", "remove", ...input.packages];
        if (input.global) {
          command = ["yarn", "global", "remove", ...input.packages];
        }
        break;
      case "pnpm":
        command = ["pnpm", "remove", ...input.packages];
        if (input.global) command.push("--global");
        if (input.save !== false) command.push("--save-prod");
        break;
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

async function handleCheckOutdated(args: unknown): Promise<ToolResult> {
  const input = CheckOutdatedSchema.parse(args);
  
  try {
    const resolvedCwd = resolveProjectCwd(input.cwd);
    const { packageManager } = await detectPackageManager(resolvedCwd);
    
    let command: string[];
    
    switch (packageManager) {
      case "npm":
        command = ["npm", "outdated"];
        if (input.depth !== undefined) command.push("--depth", input.depth.toString());
        if (input.global) command.push("-g");
        break;
      case "yarn":
        command = ["yarn", "outdated"];
        if (input.depth !== undefined) command.push("--depth", input.depth.toString());
        break;
      case "pnpm":
        command = ["pnpm", "outdated"];
        if (input.depth !== undefined) command.push("--depth", input.depth.toString());
        if (input.global) command.push("--global");
        break;
    }
    
    try {
      const { stdout } = await execa(command[0], command.slice(1), {
        cwd: resolvedCwd,
        reject: false // Don't reject on non-zero exit codes
      });
      
      if (stdout) {
        return createSuccessResponse(`📊 Outdated packages:\n\n${stdout}`);
      } else {
        return createSuccessResponse(`✅ All packages are up to date!`);
      }
    } catch (error: any) {
      // npm/yarn/pnpm outdated returns exit code 1 when packages are outdated
      // This is expected behavior, not an error
      if (error.exitCode === 1 && error.stdout) {
        return createSuccessResponse(`📊 Outdated packages:\n\n${error.stdout}`);
      }
      
      throw error;
    }
  } catch (error) {
    return createErrorResponse(error, 'Failed to check outdated packages');
  }
}