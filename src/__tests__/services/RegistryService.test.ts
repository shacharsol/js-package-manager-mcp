import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RegistryService } from '../../services/RegistryService.js';
import { URLS } from '../../constants.js';

// Mock dependencies
jest.mock('pacote');
jest.mock('undici', () => ({
  fetch: jest.fn()
}));

import pacote from 'pacote';
import { fetch } from 'undici';

const mockPacote = pacote as jest.Mocked<typeof pacote>;

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('RegistryService', () => {
  let registryService: RegistryService;

  beforeEach(() => {
    registryService = new RegistryService();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default URLs when none provided', () => {
      const service = new RegistryService();
      expect(service).toBeInstanceOf(RegistryService);
    });

    it('should accept custom URLs', () => {
      const customRegistry = 'https://custom-registry.com';
      const customBundlephobia = 'https://custom-bundlephobia.com';
      const customNpmApi = 'https://custom-npm-api.com';
      
      const service = new RegistryService(customRegistry, customBundlephobia, customNpmApi);
      expect(service).toBeInstanceOf(RegistryService);
    });
  });

  describe('search', () => {
    const mockSearchResponse = {
      objects: [
        {
          package: {
            name: 'lodash',
            version: '4.17.21',
            description: 'A modern JavaScript utility library',
            keywords: ['util', 'functional'],
            author: 'John Doe <john@example.com>',
            date: '2021-02-20T16:20:33.919Z'
          },
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
      ]
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSearchResponse)
      } as any);
    });

    it('should search packages with default parameters', async () => {
      const results = await registryService.search('lodash');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${URLS.NPM_API}/search`)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('text=lodash')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('size=25')
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('lodash');
    });

    it('should search packages with custom parameters', async () => {
      await registryService.search('react', 10, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('text=react')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('size=10')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('from=5')
      );
    });

    it('should transform search results correctly', async () => {
      const results = await registryService.search('lodash');
      const result = results[0];

      expect(result).toMatchObject({
        name: 'lodash',
        version: '4.17.21',
        description: 'A modern JavaScript utility library',
        keywords: ['util', 'functional'],
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
      });
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as any);

      await expect(registryService.search('lodash')).rejects.toThrow(
        'Failed to search packages: Search failed: 500 Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(registryService.search('lodash')).rejects.toThrow(
        'Failed to search packages: Network error'
      );
    });

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ objects: null })
      } as any);

      const results = await registryService.search('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getPackageInfo', () => {
    const mockManifest = {
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
      author: 'John Doe <john@example.com>',
      dependencies: { 'some-dep': '^1.0.0' },
      devDependencies: { 'some-dev-dep': '^2.0.0' },
      scripts: { test: 'npm test' },
      time: { '4.17.21': '2021-02-20T16:20:33.919Z' },
      dist: { tarball: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz' },
      deprecated: false
    };

    beforeEach(() => {
      mockPacote.manifest.mockResolvedValue(mockManifest as any);
    });

    it('should get package info for latest version', async () => {
      const packageInfo = await registryService.getPackageInfo('lodash');

      expect(mockPacote.manifest).toHaveBeenCalledWith('lodash', {
        registry: URLS.NPM_REGISTRY
      });
      expect(packageInfo.name).toBe('lodash');
      expect(packageInfo.version).toBe('4.17.21');
    });

    it('should get package info for specific version', async () => {
      await registryService.getPackageInfo('lodash', '4.17.20');

      expect(mockPacote.manifest).toHaveBeenCalledWith('lodash@4.17.20', {
        registry: URLS.NPM_REGISTRY
      });
    });

    it('should transform package manifest correctly', async () => {
      const packageInfo = await registryService.getPackageInfo('lodash');

      expect(packageInfo).toMatchObject({
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
        dependencies: { 'some-dep': '^1.0.0' },
        devDependencies: { 'some-dev-dep': '^2.0.0' },
        scripts: { test: 'npm test' },
        publishedAt: '2021-02-20T16:20:33.919Z'
      });
    });

    it('should handle pacote errors', async () => {
      mockPacote.manifest.mockRejectedValue(new Error('Package not found'));

      await expect(registryService.getPackageInfo('nonexistent')).rejects.toThrow(
        'Failed to get package info for nonexistent: Package not found'
      );
    });
  });

  describe('getDownloadStats', () => {
    const mockDownloadResponse = {
      downloads: 50000000,
      start: '2023-01-01',
      end: '2023-01-31'
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDownloadResponse)
      } as any);
    });

    it('should get download statistics', async () => {
      const stats = await registryService.getDownloadStats('lodash', 'last-month');

      expect(mockFetch).toHaveBeenCalledWith(
        `${URLS.NPM_API}/downloads/point/last-month/lodash`
      );
      expect(stats).toEqual({
        downloads: 50000000,
        period: 'last-month',
        start: '2023-01-01',
        end: '2023-01-31'
      });
    });

    it('should handle encoded package names', async () => {
      await registryService.getDownloadStats('@types/node', 'last-week');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('%40types%2Fnode')
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      } as any);

      await expect(
        registryService.getDownloadStats('nonexistent', 'last-month')
      ).rejects.toThrow('Failed to get download stats: Downloads API failed: 404');
    });

    it('should handle missing downloads data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as any);

      const stats = await registryService.getDownloadStats('lodash', 'last-month');
      expect(stats.downloads).toBe(0);
    });
  });

  describe('getBundleSize', () => {
    const mockBundleResponse = {
      size: 24000,
      gzip: 7000,
      dependencyCount: 5
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBundleResponse)
      } as any);
    });

    it('should get bundle size information', async () => {
      const bundleSize = await registryService.getBundleSize('lodash');

      expect(mockFetch).toHaveBeenCalledWith(
        `${URLS.BUNDLEPHOBIA_API}/size?package=lodash`
      );
      expect(bundleSize).toEqual({
        size: 24000,
        gzip: 7000,
        dependency: 5,
        dependencyCount: 5
      });
    });

    it('should handle specific version', async () => {
      await registryService.getBundleSize('lodash', '4.17.21');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('package=lodash@4.17.21')
      );
    });

    it('should return defaults on API error', async () => {
      mockFetch.mockRejectedValue(new Error('API error'));

      const bundleSize = await registryService.getBundleSize('lodash');
      expect(bundleSize).toEqual({
        size: 0,
        gzip: 0,
        dependency: 0,
        dependencyCount: 0
      });
    });
  });

  describe('getPackageMetadata', () => {
    const mockMetadata = {
      name: 'lodash',
      versions: {
        '4.17.21': {},
        '4.17.20': {},
        '4.17.19': {}
      }
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      } as any);
    });

    it('should get package metadata', async () => {
      const metadata = await registryService.getPackageMetadata('lodash');

      expect(mockFetch).toHaveBeenCalledWith(
        `${URLS.NPM_REGISTRY}/lodash`
      );
      expect(metadata).toEqual(mockMetadata);
    });

    it('should handle encoded package names', async () => {
      await registryService.getPackageMetadata('@types/node');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('%40types%2Fnode')
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      } as any);

      await expect(registryService.getPackageMetadata('nonexistent')).rejects.toThrow(
        'Failed to get package metadata: Registry request failed: 404'
      );
    });
  });

  describe('getPackageVersions', () => {
    const mockMetadata = {
      versions: {
        '4.17.21': {},
        '4.17.20': {},
        '4.17.19': {},
        '4.16.0': {}
      }
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      } as any);
    });

    it('should get package versions sorted', async () => {
      const versions = await registryService.getPackageVersions('lodash');

      expect(versions).toEqual(['4.17.21', '4.17.20', '4.17.19', '4.16.0']);
    });

    it('should handle packages with no versions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as any);

      const versions = await registryService.getPackageVersions('lodash');
      expect(versions).toEqual([]);
    });
  });

  describe('packageExists', () => {
    it('should return true for existing package', async () => {
      mockFetch.mockResolvedValue({
        ok: true
      } as any);

      const exists = await registryService.packageExists('lodash');
      expect(exists).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${URLS.NPM_REGISTRY}/lodash`,
        { method: 'HEAD' }
      );
    });

    it('should return false for non-existing package', async () => {
      mockFetch.mockResolvedValue({
        ok: false
      } as any);

      const exists = await registryService.packageExists('nonexistent');
      expect(exists).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const exists = await registryService.packageExists('lodash');
      expect(exists).toBe(false);
    });
  });

  describe('transformAuthor', () => {
    it('should handle string author format', async () => {
      const mockManifestWithStringAuthor = {
        name: 'test',
        version: '1.0.0',
        author: 'John Doe <john@example.com> (https://johndoe.com)',
        dist: { tarball: 'https://registry.npmjs.org/test/-/test-1.0.0.tgz' },
        deprecated: false
      };

      mockPacote.manifest.mockResolvedValue(mockManifestWithStringAuthor as any);
      const packageInfo = await registryService.getPackageInfo('test');

      expect(packageInfo.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        url: 'https://johndoe.com'
      });
    });

    it('should handle object author format', async () => {
      const mockManifestWithObjectAuthor = {
        name: 'test',
        version: '1.0.0',
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          url: 'https://johndoe.com'
        },
        dist: { tarball: 'https://registry.npmjs.org/test/-/test-1.0.0.tgz' },
        deprecated: false
      };

      mockPacote.manifest.mockResolvedValue(mockManifestWithObjectAuthor as any);
      const packageInfo = await registryService.getPackageInfo('test');

      expect(packageInfo.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        url: 'https://johndoe.com'
      });
    });

    it('should handle simple string author', async () => {
      const mockManifestWithSimpleAuthor = {
        name: 'test',
        version: '1.0.0',
        author: 'John Doe',
        dist: { tarball: 'https://registry.npmjs.org/test/-/test-1.0.0.tgz' },
        deprecated: false
      };

      mockPacote.manifest.mockResolvedValue(mockManifestWithSimpleAuthor as any);
      const packageInfo = await registryService.getPackageInfo('test');

      expect(packageInfo.author).toEqual({
        name: 'John Doe'
      });
    });
  });
});