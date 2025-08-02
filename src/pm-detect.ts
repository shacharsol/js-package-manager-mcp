import { access, readFile } from "fs/promises";
import { join } from "path";
import { execa } from "execa";

export type PackageManager = "npm" | "yarn" | "pnpm";

export interface DetectionResult {
  packageManager: PackageManager;
  lockFile: string | null;
  version: string | null;
}

export async function detectPackageManager(cwd: string = process.cwd()): Promise<DetectionResult> {
  // Check for lock files
  const lockFiles: Record<PackageManager, string> = {
    pnpm: "pnpm-lock.yaml",
    yarn: "yarn.lock",
    npm: "package-lock.json"
  };
  
  for (const [pm, lockFile] of Object.entries(lockFiles) as [PackageManager, string][]) {
    try {
      await access(join(cwd, lockFile));
      const version = await getPackageManagerVersion(pm);
      return { 
        packageManager: pm, 
        lockFile: join(cwd, lockFile),
        version 
      };
    } catch {
      // Continue checking
    }
  }
  
  // Check for package manager configuration files
  try {
    await access(join(cwd, ".npmrc"));
    const version = await getPackageManagerVersion("npm");
    return { packageManager: "npm", lockFile: null, version };
  } catch {}
  
  try {
    await access(join(cwd, ".yarnrc.yml"));
    const version = await getPackageManagerVersion("yarn");
    return { packageManager: "yarn", lockFile: null, version };
  } catch {}
  
  // Check packageManager field in package.json
  try {
    const packageJson = JSON.parse(
      await readFile(join(cwd, "package.json"), "utf-8")
    );
    
    if (packageJson.packageManager) {
      const [pm] = packageJson.packageManager.split("@");
      if (["npm", "yarn", "pnpm"].includes(pm)) {
        const version = await getPackageManagerVersion(pm as PackageManager);
        return { 
          packageManager: pm as PackageManager, 
          lockFile: null,
          version 
        };
      }
    }
  } catch {}
  
  // Default to npm
  const version = await getPackageManagerVersion("npm");
  return { packageManager: "npm", lockFile: null, version };
}

async function getPackageManagerVersion(pm: PackageManager): Promise<string | null> {
  try {
    const { stdout } = await execa(pm, ["--version"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

export function getInstallCommand(pm: PackageManager, packages: string[] = []): string[] {
  if (packages.length === 0) {
    // Install all dependencies
    return [pm, "install"];
  }
  
  switch (pm) {
    case "npm":
      return ["npm", "install", ...packages];
    case "yarn":
      return ["yarn", "add", ...packages];
    case "pnpm":
      return ["pnpm", "add", ...packages];
  }
}

export function getUpdateCommand(pm: PackageManager, packages: string[] = []): string[] {
  if (packages.length === 0) {
    // Update all dependencies
    switch (pm) {
      case "npm":
        return ["npm", "update"];
      case "yarn":
        return ["yarn", "upgrade"];
      case "pnpm":
        return ["pnpm", "update"];
    }
  }
  
  switch (pm) {
    case "npm":
      return ["npm", "update", ...packages];
    case "yarn":
      return ["yarn", "upgrade", ...packages];
    case "pnpm":
      return ["pnpm", "update", ...packages];
  }
}

export function getRemoveCommand(pm: PackageManager, packages: string[]): string[] {
  switch (pm) {
    case "npm":
      return ["npm", "uninstall", ...packages];
    case "yarn":
      return ["yarn", "remove", ...packages];
    case "pnpm":
      return ["pnpm", "remove", ...packages];
  }
}

export function getAuditCommand(pm: PackageManager, fix: boolean = false): string[] {
  const baseCmd = [pm, "audit"];
  
  if (fix) {
    switch (pm) {
      case "npm":
        return [...baseCmd, "fix"];
      case "yarn":
        return ["yarn", "audit", "--fix"]; // Note: Yarn's audit fix is limited
      case "pnpm":
        return [...baseCmd, "--fix"];
    }
  }
  
  return baseCmd;
}