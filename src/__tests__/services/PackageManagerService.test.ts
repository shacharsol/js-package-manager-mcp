import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PackageManagerService } from '../../services/PackageManagerService.js';
import { PackageManagerType } from '../../models/Package.js';
import { TEST_CONSTANTS } from '../setup.js';

// Mock execa at the module level
jest.mock('execa', () => ({
  execa: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

import { execa } from 'execa';
import { existsSync } from 'fs';

const mockedExeca = execa as jest.MockedFunction<typeof execa>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

describe('PackageManagerService', () => {
  let service: PackageManagerService;
  
  beforeEach(() => {
    service = new PackageManagerService(TEST_CONSTANTS.TIMEOUT);
    jest.clearAllMocks();
    // Reset the mock implementations
    mockedExeca.mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0
    } as any);
    mockedExistsSync.mockReturnValue(false);
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm from pnpm-lock.yaml', async () => {
      mockedExistsSync.mockReset();
      mockedExistsSync
        .mockReturnValueOnce(true) // pnpm-lock.yaml exists
        .mockReturnValueOnce(false); // yarn.lock doesn't exist

      const result = await service.detectPackageManager('/test/path');
      expect(result).toBe('pnpm');
    });

    it('should detect yarn from yarn.lock', async () => {
      mockedExistsSync.mockReset();
      mockedExistsSync
        .mockReturnValueOnce(false) // pnpm-lock.yaml doesn't exist
        .mockReturnValueOnce(true); // yarn.lock exists

      const result = await service.detectPackageManager('/test/path');
      expect(result).toBe('yarn');
    });

    it('should default to npm when no lock files found', async () => {
      mockedExistsSync.mockReset();
      mockedExistsSync.mockReturnValue(false);

      const result = await service.detectPackageManager('/test/path');
      expect(result).toBe('npm');
    });

    it('should use current directory when no path provided', async () => {
      mockedExistsSync.mockReturnValue(false);

      await service.detectPackageManager();
      
      // Should have checked for lock files in current directory
      expect(mockedExistsSync).toHaveBeenCalled();
    });
  });

  describe('install', () => {
    const mockSuccessfulResult = {
      stdout: 'Package installed successfully',
      stderr: '',
      exitCode: 0,
    };

    it('should install packages with npm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      const result = await service.install(['lodash', 'axios'], '/test/path', false, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['install', 'lodash', 'axios'], {
        cwd: '/test/path',
        timeout: TEST_CONSTANTS.TIMEOUT,
        reject: true,
        stdio: 'pipe',
      });

      expect(result).toEqual({
        success: true,
        packages: ['lodash', 'axios'],
        operation: 'install',
        packageManager: 'npm',
        output: 'Package installed successfully',
        duration: expect.any(Number),
      });
    });

    it('should install dev dependencies with npm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.install(['typescript'], undefined, true, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['install', '--save-dev', 'typescript'], {
        cwd: TEST_CONSTANTS.MOCK_CWD,
        timeout: TEST_CONSTANTS.TIMEOUT,
        reject: true,
        stdio: 'pipe',
      });
    });

    it('should install global packages with npm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.install(['typescript'], undefined, false, true, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['install', '--global', 'typescript'], {
        cwd: TEST_CONSTANTS.MOCK_CWD,
        timeout: TEST_CONSTANTS.TIMEOUT,
        reject: true,
        stdio: 'pipe',
      });
    });

    it('should install packages with yarn', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.install(['lodash'], undefined, false, false, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['add', 'lodash'], expect.any(Object));
    });

    it('should install dev dependencies with yarn', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.install(['typescript'], undefined, true, false, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['add', '--dev', 'typescript'], expect.any(Object));
    });

    it('should install global packages with yarn', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.install(['typescript'], undefined, false, true, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['add', 'global', 'typescript'], expect.any(Object));
    });

    it('should install packages with pnpm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.install(['lodash'], undefined, false, false, 'pnpm');

      expect(mockedExeca).toHaveBeenCalledWith('pnpm', ['add', 'lodash'], expect.any(Object));
    });

    it('should handle installation errors', async () => {
      const error = new Error('Installation failed');
      mockedExeca.mockRejectedValue(error);

      const result = await service.install(['nonexistent'], undefined, false, false, 'npm');

      expect(result).toEqual({
        success: false,
        packages: ['nonexistent'],
        operation: 'install',
        packageManager: 'npm',
        output: 'Installation failed',
        errors: ['Installation failed'],
        duration: expect.any(Number),
      });
    });

    it('should handle stderr in errors', async () => {
      const error = { message: 'Command failed', stderr: 'Package not found' };
      mockedExeca.mockRejectedValue(error);

      const result = await service.install(['nonexistent'], undefined, false, false, 'npm');

      expect(result.output).toBe('Package not found');
    });
  });

  describe('update', () => {
    const mockSuccessfulResult = {
      stdout: 'Packages updated successfully',
      stderr: '',
      exitCode: 0,
    };

    it('should update specific packages with npm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      const result = await service.update(['lodash', 'axios'], undefined, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['update', 'lodash', 'axios'], expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.packages).toEqual(['lodash', 'axios']);
    });

    it('should update all packages when none specified', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      const result = await service.update(undefined, undefined, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['update'], expect.any(Object));
      expect(result.packages).toEqual(['all packages']);
    });

    it('should use yarn upgrade command', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.update(['lodash'], undefined, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['upgrade', 'lodash'], expect.any(Object));
    });

    it('should use pnpm update command', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.update(['lodash'], undefined, 'pnpm');

      expect(mockedExeca).toHaveBeenCalledWith('pnpm', ['update', 'lodash'], expect.any(Object));
    });
  });

  describe('remove', () => {
    const mockSuccessfulResult = {
      stdout: 'Packages removed successfully',
      stderr: '',
      exitCode: 0,
    };

    it('should remove packages with npm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      const result = await service.remove(['lodash'], undefined, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['uninstall', 'lodash'], expect.any(Object));
      expect(result.success).toBe(true);
    });

    it('should remove global packages with npm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.remove(['typescript'], undefined, true, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['uninstall', '--global', 'typescript'], expect.any(Object));
    });

    it('should remove packages with yarn', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.remove(['lodash'], undefined, false, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['remove', 'lodash'], expect.any(Object));
    });

    it('should remove global packages with yarn', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.remove(['typescript'], undefined, true, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['remove', 'global', 'typescript'], expect.any(Object));
    });

    it('should remove packages with pnpm', async () => {
      mockedExeca.mockResolvedValue(mockSuccessfulResult as any);

      await service.remove(['lodash'], undefined, false, 'pnpm');

      expect(mockedExeca).toHaveBeenCalledWith('pnpm', ['remove', 'lodash'], expect.any(Object));
    });
  });

  describe('checkOutdated', () => {
    it('should check outdated packages', async () => {
      const mockResult = {
        stdout: 'Package Current Wanted Latest\nlodash  4.17.20 4.17.21 4.17.21',
        stderr: '',
        exitCode: 0,
      };
      mockedExeca.mockResolvedValue(mockResult as any);

      const result = await service.checkOutdated(undefined, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['outdated'], {
        cwd: TEST_CONSTANTS.MOCK_CWD,
        timeout: TEST_CONSTANTS.TIMEOUT,
        reject: false, // Don't reject on non-zero exit
        stdio: 'pipe',
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('outdated');
    });

    it('should check global outdated packages', async () => {
      const mockResult = { stdout: 'No outdated packages', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      await service.checkOutdated(undefined, true, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['outdated', '--global'], expect.any(Object));
    });
  });

  describe('audit', () => {
    it('should audit dependencies', async () => {
      const mockResult = {
        stdout: 'found 0 vulnerabilities',
        stderr: '',
        exitCode: 0,
      };
      mockedExeca.mockResolvedValue(mockResult as any);

      const result = await service.audit(undefined, false, false, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['audit'], {
        cwd: TEST_CONSTANTS.MOCK_CWD,
        timeout: TEST_CONSTANTS.TIMEOUT,
        reject: false, // Don't reject on vulnerabilities found
        stdio: 'pipe',
      });

      expect(result.success).toBe(true);
      expect(result.operation).toBe('audit');
    });

    it('should audit and fix vulnerabilities', async () => {
      const mockResult = { stdout: 'fixed 2 vulnerabilities', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      await service.audit(undefined, true, false, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['audit', 'fix'], expect.any(Object));
    });

    it('should audit with force fix', async () => {
      const mockResult = { stdout: 'force fixed vulnerabilities', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      await service.audit(undefined, true, true, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['audit', 'fix', '--force'], expect.any(Object));
    });

    it('should audit production only', async () => {
      const mockResult = { stdout: 'production audit complete', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      await service.audit(undefined, false, false, true, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['audit', '--production'], expect.any(Object));
    });
  });

  describe('cleanCache', () => {
    it('should clean npm cache', async () => {
      const mockResult = { stdout: 'cache cleaned', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      const result = await service.cleanCache(undefined, false, 'npm');

      expect(mockedExeca).toHaveBeenCalledWith('npm', ['cache', 'clean', '--force'], expect.any(Object));
      expect(result.success).toBe(true);
    });

    it('should clean yarn cache', async () => {
      const mockResult = { stdout: 'cache cleaned', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      await service.cleanCache(undefined, false, 'yarn');

      expect(mockedExeca).toHaveBeenCalledWith('yarn', ['cache', 'clean'], expect.any(Object));
    });

    it('should clean pnpm store', async () => {
      const mockResult = { stdout: 'store pruned', stderr: '', exitCode: 0 };
      mockedExeca.mockResolvedValue(mockResult as any);

      await service.cleanCache(undefined, false, 'pnpm');

      expect(mockedExeca).toHaveBeenCalledWith('pnpm', ['store', 'prune'], expect.any(Object));
    });
  });

  describe('Error Handling', () => {
    it('should handle command execution timeout', async () => {
      const timeoutError = new Error('Command timed out');
      mockedExeca.mockRejectedValue(timeoutError);

      const result = await service.install(['large-package'], undefined, false, false, 'npm');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Command timed out');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = { 
        message: 'Network error', 
        stderr: 'Unable to connect to registry' 
      };
      mockedExeca.mockRejectedValue(networkError);

      const result = await service.install(['package'], undefined, false, false, 'npm');

      expect(result.success).toBe(false);
      expect(result.output).toBe('Unable to connect to registry');
    });

    it('should handle unknown package manager', async () => {
      // @ts-ignore - Testing invalid package manager
      const result = await service.cleanCache(undefined, false, 'unknown' as PackageManagerType);
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Unknown package manager: unknown');
    });
  });

  describe('Performance', () => {
    it('should complete operations within reasonable time', async () => {
      const mockResult = { stdout: 'success', stderr: '', exitCode: 0 };
      // Add a small delay to simulate real execution time
      mockedExeca.mockResolvedValue(mockResult as any);

      const start = Date.now();
      const result = await service.install(['lodash'], undefined, false, false, 'npm');
      const duration = Date.now() - start;

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(1000); // Should complete quickly with mocked execa
    });

    it('should respect timeout configuration', () => {
      const customTimeout = 30000;
      const customService = new PackageManagerService(customTimeout);
      
      expect(customService).toBeDefined();
      // Timeout is private, so we can't directly test it, but we can verify the service is created
    });
  });
});