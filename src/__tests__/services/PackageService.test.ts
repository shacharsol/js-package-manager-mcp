import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PackageService } from '../../services/PackageService.js';
import { CacheService } from '../../services/CacheService.js';
import { PackageManagerService } from '../../services/PackageManagerService.js';
import { SecurityService } from '../../services/SecurityService.js';
import { RegistryService } from '../../services/RegistryService.js';
import { PackageSearchResult, Package, PackageInstallRequest, PackageOperationResult } from '../../models/Package.js';

// Mock all dependencies
jest.mock('../../services/CacheService.js');
jest.mock('../../services/PackageManagerService.js');
jest.mock('../../services/SecurityService.js');
jest.mock('../../services/RegistryService.js');

const MockCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const MockPackageManagerService = PackageManagerService as jest.MockedClass<typeof PackageManagerService>;
const MockSecurityService = SecurityService as jest.MockedClass<typeof SecurityService>;
const MockRegistryService = RegistryService as jest.MockedClass<typeof RegistryService>;

describe('PackageService', () => {
  let packageService: PackageService;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockPackageManagerService: jest.Mocked<PackageManagerService>;
  let mockSecurityService: jest.Mocked<SecurityService>;
  let mockRegistryService: jest.Mocked<RegistryService>;

  const mockSearchResults: PackageSearchResult[] = [
    {
      name: 'lodash',
      version: '4.17.21',
      description: 'A modern JavaScript utility library',
      keywords: ['util', 'functional'],
      author: { name: 'John Doe', email: 'john@example.com' },
      publishedAt: '2021-02-20T16:20:33.919Z',
      score: {
        final: 0.8,
        detail: {
          quality: 0.9,
          popularity: 0.7,
          maintenance: 0.8
        }
      },
      searchScore: 100000.5
    }
  ];

  const mockPackage: Package = {
    name: 'lodash',
    version: '4.17.21',
    description: 'A modern JavaScript utility library',
    keywords: ['util', 'functional'],
    homepage: 'https://lodash.com',
    repository: {
      type: 'git',
      url: 'https://github.com/lodash/lodash.git'
    },
    license: 'MIT',
    author: { name: 'John Doe', email: 'john@example.com' },
    dependencies: { 'some-dep': '^1.0.0' },
    publishedAt: '2021-02-20T16:20:33.919Z'
  };

  const mockOperationResult: PackageOperationResult = {
    success: true,
    packages: ['lodash'],
    operation: 'install',
    output: 'added 1 package',
    duration: 1500,
    packageManager: 'npm'
  };

  beforeEach(() => {
    // Create mock instances
    mockCacheService = new MockCacheService() as jest.Mocked<CacheService>;
    mockPackageManagerService = new MockPackageManagerService() as jest.Mocked<PackageManagerService>;
    mockSecurityService = new MockSecurityService() as jest.Mocked<SecurityService>;
    mockRegistryService = new MockRegistryService() as jest.Mocked<RegistryService>;

    packageService = new PackageService(
      mockCacheService,
      mockPackageManagerService,
      mockSecurityService,
      mockRegistryService
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with required dependencies', () => {
      expect(packageService).toBeInstanceOf(PackageService);
    });
  });

  describe('searchPackages', () => {
    beforeEach(() => {
      mockRegistryService.search.mockResolvedValue(mockSearchResults);
    });

    it('should return cached results if available', async () => {
      mockCacheService.get.mockResolvedValue(mockSearchResults);

      const results = await packageService.searchPackages('lodash');

      expect(mockCacheService.get).toHaveBeenCalledWith('search:lodash:25:0');
      expect(mockRegistryService.search).not.toHaveBeenCalled();
      expect(results).toEqual(mockSearchResults);
    });

    it('should search registry when no cache available', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const results = await packageService.searchPackages('lodash');

      expect(mockCacheService.get).toHaveBeenCalledWith('search:lodash:25:0');
      expect(mockRegistryService.search).toHaveBeenCalledWith('lodash', 25, 0);
      expect(mockCacheService.set).toHaveBeenCalledWith('search:lodash:25:0', mockSearchResults, 900);
      expect(results).toEqual(mockSearchResults);
    });

    it('should support custom limit and from parameters', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await packageService.searchPackages('react', 10, 5);

      expect(mockCacheService.get).toHaveBeenCalledWith('search:react:10:5');
      expect(mockRegistryService.search).toHaveBeenCalledWith('react', 10, 5);
      expect(mockCacheService.set).toHaveBeenCalledWith('search:react:10:5', mockSearchResults, 900);
    });

    it('should use default parameters when none provided', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await packageService.searchPackages('test');

      expect(mockRegistryService.search).toHaveBeenCalledWith('test', 25, 0);
    });
  });

  describe('getPackageInfo', () => {
    const mockDownloadStats = {
      downloads: 50000000,
      period: 'last-week' as const,
      start: '2023-01-01',
      end: '2023-01-07'
    };

    const mockBundleSize = {
      size: 24000,
      gzip: 7000,
      dependency: 5,
      dependencyCount: 5
    };

    const mockSecurityInfo = {
      vulnerabilities: [],
      hasVulnerabilities: false,
      severity: 'info' as const
    };

    beforeEach(() => {
      mockRegistryService.getPackageInfo.mockResolvedValue(mockPackage);
      mockRegistryService.getDownloadStats.mockResolvedValue(mockDownloadStats);
      mockRegistryService.getBundleSize.mockResolvedValue(mockBundleSize);
      mockSecurityService.checkVulnerabilities.mockResolvedValue(mockSecurityInfo);
    });

    it('should return cached package info if available', async () => {
      const cachedPackage = { ...mockPackage, downloadStats: mockDownloadStats };
      mockCacheService.get.mockResolvedValue(cachedPackage);

      const result = await packageService.getPackageInfo('lodash');

      expect(mockCacheService.get).toHaveBeenCalledWith('package:lodash:latest');
      expect(mockRegistryService.getPackageInfo).not.toHaveBeenCalled();
      expect(result).toEqual(cachedPackage);
    });

    it('should fetch and enhance package info when not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await packageService.getPackageInfo('lodash');

      expect(mockRegistryService.getPackageInfo).toHaveBeenCalledWith('lodash', undefined);
      expect(mockRegistryService.getDownloadStats).toHaveBeenCalledWith('lodash', 'last-week');
      expect(mockRegistryService.getBundleSize).toHaveBeenCalledWith('lodash', '4.17.21');
      expect(mockSecurityService.checkVulnerabilities).toHaveBeenCalledWith('lodash', '4.17.21');

      expect(result).toEqual({
        ...mockPackage,
        downloadStats: mockDownloadStats,
        bundleSize: mockBundleSize,
        securityInfo: mockSecurityInfo
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'package:lodash:latest',
        expect.objectContaining({
          ...mockPackage,
          downloadStats: mockDownloadStats,
          bundleSize: mockBundleSize,
          securityInfo: mockSecurityInfo
        }),
        3600
      );
    });

    it('should support specific version requests', async () => {
      mockCacheService.get.mockResolvedValue(null);

      await packageService.getPackageInfo('lodash', '4.17.20');

      expect(mockCacheService.get).toHaveBeenCalledWith('package:lodash:4.17.20');
      expect(mockRegistryService.getPackageInfo).toHaveBeenCalledWith('lodash', '4.17.20');
    });

    it('should handle errors in enhancement data gracefully', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRegistryService.getDownloadStats.mockRejectedValue(new Error('Download stats failed'));
      mockRegistryService.getBundleSize.mockRejectedValue(new Error('Bundle size failed'));
      mockSecurityService.checkVulnerabilities.mockRejectedValue(new Error('Security check failed'));

      const result = await packageService.getPackageInfo('lodash');

      expect(result).toEqual({
        ...mockPackage,
        downloadStats: undefined,
        bundleSize: undefined,
        securityInfo: undefined
      });
    });
  });

  describe('installPackages', () => {
    beforeEach(() => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.install.mockResolvedValue(mockOperationResult);
    });

    it('should install packages with detected package manager', async () => {
      const request: PackageInstallRequest = {
        packages: ['lodash', 'axios'],
        cwd: '/test/project'
      };

      const result = await packageService.installPackages(request);

      expect(mockPackageManagerService.detectPackageManager).toHaveBeenCalledWith('/test/project');
      expect(mockPackageManagerService.install).toHaveBeenCalledWith(
        ['lodash', 'axios'],
        '/test/project',
        undefined,
        undefined,
        'npm'
      );
      expect(result).toEqual(mockOperationResult);
    });

    it('should use specified package manager instead of detecting', async () => {
      const request: PackageInstallRequest = {
        packages: ['react'],
        cwd: '/test/project',
        packageManager: 'yarn'
      };

      await packageService.installPackages(request);

      expect(mockPackageManagerService.detectPackageManager).not.toHaveBeenCalled();
      expect(mockPackageManagerService.install).toHaveBeenCalledWith(
        ['react'],
        '/test/project',
        undefined,
        undefined,
        'yarn'
      );
    });

    it('should pass through dev and global options', async () => {
      const request: PackageInstallRequest = {
        packages: ['typescript'],
        cwd: '/test/project',
        dev: true,
        global: false
      };

      await packageService.installPackages(request);

      expect(mockPackageManagerService.install).toHaveBeenCalledWith(
        ['typescript'],
        '/test/project',
        true,
        false,
        'npm'
      );
    });
  });

  describe('updatePackages', () => {
    beforeEach(() => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.update.mockResolvedValue(mockOperationResult);
    });

    it('should update packages with detected package manager', async () => {
      const result = await packageService.updatePackages(['lodash'], '/test/project');

      expect(mockPackageManagerService.detectPackageManager).toHaveBeenCalledWith('/test/project');
      expect(mockPackageManagerService.update).toHaveBeenCalledWith(['lodash'], '/test/project', 'npm');
      expect(result).toEqual(mockOperationResult);
    });

    it('should use specified package manager', async () => {
      await packageService.updatePackages(['lodash'], '/test/project', 'yarn');

      expect(mockPackageManagerService.detectPackageManager).not.toHaveBeenCalled();
      expect(mockPackageManagerService.update).toHaveBeenCalledWith(['lodash'], '/test/project', 'yarn');
    });

    it('should handle undefined packages', async () => {
      await packageService.updatePackages(undefined, '/test/project');

      expect(mockPackageManagerService.update).toHaveBeenCalledWith(undefined, '/test/project', 'npm');
    });
  });

  describe('removePackages', () => {
    beforeEach(() => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.remove.mockResolvedValue(mockOperationResult);
    });

    it('should remove packages with detected package manager', async () => {
      const result = await packageService.removePackages(['lodash'], '/test/project');

      expect(mockPackageManagerService.detectPackageManager).toHaveBeenCalledWith('/test/project');
      expect(mockPackageManagerService.remove).toHaveBeenCalledWith(
        ['lodash'],
        '/test/project',
        undefined,
        'npm'
      );
      expect(result).toEqual(mockOperationResult);
    });

    it('should pass through global option', async () => {
      await packageService.removePackages(['lodash'], '/test/project', true, 'yarn');

      expect(mockPackageManagerService.detectPackageManager).not.toHaveBeenCalled();
      expect(mockPackageManagerService.remove).toHaveBeenCalledWith(
        ['lodash'],
        '/test/project',
        true,
        'yarn'
      );
    });
  });

  describe('checkOutdated', () => {
    beforeEach(() => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.checkOutdated.mockResolvedValue(mockOperationResult);
    });

    it('should check outdated packages with detected package manager', async () => {
      const result = await packageService.checkOutdated('/test/project');

      expect(mockPackageManagerService.detectPackageManager).toHaveBeenCalledWith('/test/project');
      expect(mockPackageManagerService.checkOutdated).toHaveBeenCalledWith(
        '/test/project',
        undefined,
        'npm'
      );
      expect(result).toEqual(mockOperationResult);
    });

    it('should pass through global option', async () => {
      await packageService.checkOutdated('/test/project', true, 'yarn');

      expect(mockPackageManagerService.checkOutdated).toHaveBeenCalledWith('/test/project', true, 'yarn');
    });
  });

  describe('auditDependencies', () => {
    beforeEach(() => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.audit.mockResolvedValue(mockOperationResult);
    });

    it('should audit dependencies with detected package manager', async () => {
      const result = await packageService.auditDependencies('/test/project');

      expect(mockPackageManagerService.detectPackageManager).toHaveBeenCalledWith('/test/project');
      expect(mockPackageManagerService.audit).toHaveBeenCalledWith(
        '/test/project',
        undefined,
        undefined,
        undefined,
        'npm'
      );
      expect(result).toEqual(mockOperationResult);
    });

    it('should pass through audit options', async () => {
      await packageService.auditDependencies('/test/project', true, false, true, 'yarn');

      expect(mockPackageManagerService.audit).toHaveBeenCalledWith(
        '/test/project',
        true,
        false,
        true,
        'yarn'
      );
    });
  });

  describe('cleanCache', () => {
    beforeEach(() => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.cleanCache.mockResolvedValue(mockOperationResult);
    });

    it('should clean cache with detected package manager', async () => {
      const result = await packageService.cleanCache('/test/project');

      expect(mockPackageManagerService.detectPackageManager).toHaveBeenCalledWith('/test/project');
      expect(mockPackageManagerService.cleanCache).toHaveBeenCalledWith(
        '/test/project',
        undefined,
        'npm'
      );
      expect(result).toEqual(mockOperationResult);
    });

    it('should pass through global option', async () => {
      await packageService.cleanCache('/test/project', true, 'yarn');

      expect(mockPackageManagerService.cleanCache).toHaveBeenCalledWith('/test/project', true, 'yarn');
    });
  });

  describe('error handling', () => {
    it('should propagate registry service errors', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRegistryService.search.mockRejectedValue(new Error('Registry error'));

      await expect(packageService.searchPackages('test')).rejects.toThrow('Registry error');
    });

    it('should propagate package manager service errors', async () => {
      mockPackageManagerService.detectPackageManager.mockResolvedValue('npm');
      mockPackageManagerService.install.mockRejectedValue(new Error('Install error'));

      const request: PackageInstallRequest = {
        packages: ['test-package'],
        cwd: '/test/project'
      };

      await expect(packageService.installPackages(request)).rejects.toThrow('Install error');
    });
  });
});