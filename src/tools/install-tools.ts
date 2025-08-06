// src/tools/install-tools.js - Complete fix

import { execa } from "execa";
import { existsSync, unlinkSync, readFileSync } from "fs";
import { join } from "path";
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

// Global lock to prevent concurrent npm operations
let npmOperationInProgress = false;
const npmOperationQueue: Array<() => void> = [];

/**
 * Clean up npm's internal state to fix idealTree errors
 */
async function cleanNpmState(cwd: string): Promise<void> {
  console.error('[npmplus-mcp] Cleaning npm state...');
  
  // 1. Kill any hanging npm processes
  try {
    await execa('pkill', ['-f', 'npm'], { reject: false });
  } catch {
    // Ignore errors
  }
  
  // 2. Remove npm's internal lock files
  const npmCachePath = join(
    process.env.HOME || process.env.USERPROFILE || '',
    '.npm'
  );
  
  // Common lock file locations
  const lockFiles = [
    join(npmCachePath, '_locks'),
    join(npmCachePath, 'anonymous-cli-metrics.json.lock'),
    join(cwd, '.npm'),
    join(cwd, 'package-lock.json.lock')
  ];
  
  for (const lockFile of lockFiles) {
    try {
      if (existsSync(lockFile)) {
        unlinkSync(lockFile);
        console.error(`[npmplus-mcp] Removed lock file: ${lockFile}`);
      }
    } catch {
      // Ignore errors
    }
  }
  
  // 3. Clear npm cache
  try {
    await execa('npm', ['cache', 'clean', '--force'], { 
      cwd,
      timeout: 10000 // 10 second timeout
    });
  } catch {
    // Ignore cache clean errors
  }
  
  // 4. Wait a bit for filesystem to settle
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Execute npm command with aggressive idealTree error recovery
 */
async function executeNpmCommandWithRetry(
  command: string[],
  cwd: string,
  maxRetries = 3
): Promise<any> {
  // Wait for any other npm operations to complete
  if (npmOperationInProgress) {
    console.error('[npmplus-mcp] Waiting for other npm operation to complete...');
    await new Promise<void>(resolve => {
      npmOperationQueue.push(resolve);
    });
  }
  
  npmOperationInProgress = true;
  let lastError: any;
  
  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.error(`[npmplus-mcp] Attempt ${attempt}/${maxRetries}: ${command.join(' ')}`);
        
        // For npm, use specific flags to avoid common issues
        const env: any = {
          ...process.env,
          npm_config_fund: 'false',
          npm_config_audit: 'false',
          npm_config_update_notifier: 'false',
          NO_UPDATE_NOTIFIER: '1',
          NPM_CONFIG_UPDATE_NOTIFIER: 'false'
        };
        
        // Add legacy peer deps flag for npm 7+
        if (command[0] === 'npm' && command[1] === 'install') {
          env.npm_config_legacy_peer_deps = 'true';
        }
        
        const result = await execa(command[0], command.slice(1), {
          cwd,
          env,
          timeout: 60000, // 60 second timeout
          reject: true
        });
        
        // Success!
        return result;
        
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.stderr || error.message || '';
        
        console.error(`[npmplus-mcp] Error on attempt ${attempt}: ${errorMessage}`);
        
        // Check if it's the idealTree error
        if (errorMessage.includes('Tracker "idealTree" already exists') ||
            errorMessage.includes('tracker idealtree already exists')) {
          
          // Aggressive cleanup before retry
          await cleanNpmState(cwd);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const waitTime = 1000 * Math.pow(2, attempt - 1);
            console.error(`[npmplus-mcp] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        } else if (errorMessage.includes('ENOTEMPTY') || 
                   errorMessage.includes('EBUSY') ||
                   errorMessage.includes('EPERM')) {
          // File system errors - wait and retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
        
        // For other errors or if we've exhausted retries, throw
        throw error;
      }
    }
    
    throw lastError || new Error('Command failed after all retries');
    
  } finally {
    // Release the lock and process any queued operations
    npmOperationInProgress = false;
    const nextOperation = npmOperationQueue.shift();
    if (nextOperation) {
      nextOperation();
    }
  }
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

// src/tools/install-tools.js - Updated handleInstallPackages function

async function handleInstallPackages(args: unknown): Promise<ToolResult> {
  const input = InstallPackagesSchema.parse(args);
  
  try {
    // Check if it's a global install with npm
    if (input.global && input.packages.length === 1) {
      const packageName = input.packages[0];
      
      // Suggest using npx for global installs
      return createSuccessResponse(
        `💡 Global Install Alternative\n\n` +
        `Instead of installing ${packageName} globally, you can use npx:\n\n` +
        `• Run directly: npx ${packageName}\n` +
        `• Run specific version: npx ${packageName}@latest\n\n` +
        `Benefits of using npx:\n` +
        `✓ Always uses the latest version\n` +
        `✓ No global pollution\n` +
        `✓ Avoids permission issues\n` +
        `✓ No idealTree conflicts\n\n` +
        `If you still want to install globally, you can run:\n` +
        `npm install -g ${packageName}\n\n` +
        `Note: Global installs may require sudo on some systems.`
      );
    }
    
    // First, do a preemptive cleanup if we're in the root directory
    if (process.cwd() === '/') {
      await cleanNpmState('.');
    }
    
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
    
    // Use the retry function with aggressive cleanup
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
    
    // Check for the idealTree error specifically
    if (error.message?.includes('Tracker "idealTree" already exists')) {
      return createErrorResponse(error,
        `⚠️ NPM Installation Blocked - Manual Fix Required\n\n` +
        `This is a known npm bug that requires manual intervention.\n\n` +
        `🔧 Quick Fix (copy and run in Terminal):\n` +
        `\`\`\`bash\n` +
        `rm -rf ~/.npm/_locks\n` +
        `rm -rf ~/.npm/_cacache/tmp\n` +
        `npm cache clean --force\n` +
        `\`\`\`\n\n` +
        `Then try installing again.\n\n` +
        `🔍 If the issue persists:\n` +
        `1. Check for running npm processes: \`ps aux | grep npm\`\n` +
        `2. Kill any hanging npm processes: \`pkill -f npm\`\n` +
        `3. Restart your terminal or computer\n\n` +
        `💡 Alternative Options:\n` +
        `• Use Yarn: \`yarn add ${input.packages.join(' ')}\`\n` +
        `• Use PNPM: \`pnpm add ${input.packages.join(' ')}\`\n` +
        `• For CLI tools, use npx: \`npx ${input.packages[0]}\``
      );
    }
    
    // Provide helpful error messages for other common errors
    let errorMessage = `Failed to install ${input.packages.join(', ')}: ${error.message}`;
    
    if (error.message?.includes('EACCES') || error.message?.includes('permission denied')) {
      errorMessage = 
        `❌ Permission Denied\n\n` +
        `Installing packages globally requires elevated permissions.\n\n` +
        `🔧 Solutions:\n` +
        `1. **Recommended**: Use npx instead\n` +
        `   • Run: \`npx ${input.packages[0]}\`\n\n` +
        `2. Configure npm to use a different directory:\n` +
        `   \`\`\`bash\n` +
        `   mkdir ~/.npm-global\n` +
        `   npm config set prefix '~/.npm-global'\n` +
        `   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc\n` +
        `   source ~/.bashrc\n` +
        `   \`\`\`\n\n` +
        `3. Use a Node version manager (nvm):\n` +
        `   • Install nvm: https://github.com/nvm-sh/nvm\n` +
        `   • Global packages will install to your user directory\n\n` +
        `4. Last resort: Use sudo (not recommended)\n` +
        `   • Run: \`sudo npm install -g ${input.packages.join(' ')}\``;
    } else if (error.message?.includes('E404')) {
      errorMessage = 
        `❌ Package Not Found\n\n` +
        `The package "${input.packages[0]}" could not be found in the npm registry.\n\n` +
        `🔍 Things to check:\n` +
        `1. Verify the package name is spelled correctly\n` +
        `2. Search for similar packages: \`npm search ${input.packages[0]}\`\n` +
        `3. Check if it exists on npm: https://www.npmjs.com/search?q=${input.packages[0]}\n\n` +
        `💡 Did you mean one of these?\n` +
        `• If it's a CLI tool, try: \`npx ${input.packages[0]}\`\n` +
        `• Common typos: express (not ekspres), lodash (not lowdash)`;
    } else if (error.message?.includes('ENOENT') || error.message?.includes('no such file')) {
      errorMessage = 
        `❌ Invalid Directory\n\n` +
        `Cannot install packages here. This doesn't appear to be a Node.js project.\n\n` +
        `🔧 Solutions:\n` +
        `1. Navigate to a Node.js project directory\n` +
        `2. Initialize a new project: \`npm init -y\`\n` +
        `3. For global installs, add the -g flag\n` +
        `4. For CLI tools, use npx: \`npx ${input.packages[0]}\``;
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      errorMessage = 
        `❌ Network Error\n\n` +
        `Cannot connect to the npm registry.\n\n` +
        `🔧 Things to check:\n` +
        `1. Check your internet connection\n` +
        `2. Check if you're behind a proxy\n` +
        `3. Try using a different registry:\n` +
        `   \`npm config set registry https://registry.npmjs.org/\`\n` +
        `4. Check your DNS settings`;
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
      // Don't use retry for outdated check - it's read-only
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