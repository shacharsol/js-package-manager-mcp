import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock external dependencies that use ESM
jest.mock('p-limit', () => {
  return jest.fn(() => (fn: Function) => fn());
});

jest.mock('undici', () => ({
  fetch: jest.fn()
}));

// Import tool handlers directly for integration testing
import * as searchTools from "../tools/search-tools.js";
import * as installTools from "../tools/install-tools.js"; 
import * as securityTools from "../tools/security-tools.js";
import * as analysisTools from "../tools/analysis-tools.js";
import * as managementTools from "../tools/management-tools.js";

import { fetch } from 'undici';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("Package Manager Integration Tests", () => {
  beforeEach(() => {
    // Reset any global state
    jest.clearAllMocks();
    
    // Setup default mocks for search API
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        objects: [
          {
            package: {
              name: 'react',
              version: '18.2.0',
              description: 'A JavaScript library for building user interfaces',
              keywords: ['react', 'javascript'],
              author: 'React Team',
              date: '2023-01-01T00:00:00.000Z'
            },
            score: { final: 0.95 },
            searchScore: 100000
          }
        ]
      })
    } as any);
  });

  describe("Tool Registration and Availability", () => {
    it("should have all expected search tools", () => {
      expect(searchTools.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "search_packages" })
        ])
      );
      expect(searchTools.handlers.has("search_packages")).toBe(true);
    });

    it("should have all expected install tools", () => {
      const expectedTools = ["install_packages", "update_packages", "remove_packages"];
      expectedTools.forEach(toolName => {
        expect(installTools.tools).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: toolName })
          ])
        );
        expect(installTools.handlers.has(toolName)).toBe(true);
      });
    });

    it("should have all expected security tools", () => {
      const expectedTools = ["audit_dependencies", "check_vulnerability"];
      expectedTools.forEach(toolName => {
        expect(securityTools.tools).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: toolName })
          ])
        );
        expect(securityTools.handlers.has(toolName)).toBe(true);
      });
    });

    it("should have all expected analysis tools", () => {
      const expectedTools = ["check_bundle_size", "analyze_dependencies", "dependency_tree"];
      expectedTools.forEach(toolName => {
        expect(analysisTools.tools).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: toolName })
          ])
        );
        expect(analysisTools.handlers.has(toolName)).toBe(true);
      });
    });

    it("should have all expected management tools", () => {
      const expectedTools = ["list_licenses", "check_license", "clean_cache", "package_info"];
      expectedTools.forEach(toolName => {
        expect(managementTools.tools).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: toolName })
          ])
        );
        expect(managementTools.handlers.has(toolName)).toBe(true);
      });
    });

    it("should have download_stats in analysis tools", () => {
      expect(analysisTools.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "download_stats" })
        ])
      );
      expect(analysisTools.handlers.has("download_stats")).toBe(true);
    });

    it("should have check_outdated in install tools", () => {
      expect(installTools.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "check_outdated" })
        ])
      );
      expect(installTools.handlers.has("check_outdated")).toBe(true);
    });
  });

  describe("Search Tool Integration", () => {
    it("should search for packages", async () => {
      const handler = searchTools.handlers.get("search_packages");
      expect(handler).toBeDefined();

      const result = await handler!({
        query: "react",
        limit: 5
      });

      expect(result).toEqual(
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/🔍 Search results for.*react/i)
            })
          ])
        })
      );
    });

    it("should validate search input", async () => {
      const handler = searchTools.handlers.get("search_packages");
      expect(handler).toBeDefined();

      await expect(handler!({
        query: "react",
        limit: 150 // exceeds max
      })).rejects.toThrow();
    });

    it("should handle empty search query", async () => {
      const handler = searchTools.handlers.get("search_packages");
      expect(handler).toBeDefined();

      await expect(handler!({
        query: "",
        limit: 5
      })).rejects.toThrow();
    });
  });

  describe("Package Info Integration", () => {
    beforeEach(() => {
      // Setup specific mock for package info API
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          name: 'express',
          "dist-tags": { latest: '4.18.2' },
          versions: {
            '4.18.2': {
              name: 'express',
              version: '4.18.2',
              description: 'Fast, unopinionated, minimalist web framework',
              homepage: 'https://expressjs.com/',
              repository: { type: 'git', url: 'https://github.com/expressjs/express.git' },
              license: 'MIT',
              author: 'TJ Holowaychuk',
              dependencies: {},
              devDependencies: {},
              keywords: ['express', 'framework', 'web']
            }
          },
          time: { '4.18.2': '2023-01-01T00:00:00.000Z' }
        })
      } as any);
    });

    it("should get package information", async () => {
      const handler = managementTools.handlers.get("package_info");
      expect(handler).toBeDefined();

      const result = await handler!({
        packageName: "express"
      });

      expect(result).toEqual(
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/Package Information.*express/i)
            })
          ])
        })
      );
    });

    it("should handle non-existent packages", async () => {
      // Mock fetch to return 404 error for non-existent package
      mockFetch.mockRejectedValue(new Error('HTTP 404: Not Found'));

      const handler = managementTools.handlers.get("package_info");
      expect(handler).toBeDefined();

      const result = await handler!({
        packageName: "this-package-definitely-does-not-exist-12345"
      });

      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/Failed to get package info/i)
            })
          ])
        })
      );
    });
  });

  describe("Download Stats Integration", () => {
    beforeEach(() => {
      // Setup mock for download stats API
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          downloads: 50000000,
          start: '2023-07-25',
          end: '2023-08-01'
        })
      } as any);
    });

    it("should get download statistics", async () => {
      const handler = analysisTools.handlers.get("download_stats");
      expect(handler).toBeDefined();

      const result = await handler!({
        packageName: "react",
        period: "last-week"
      });

      expect(result).toEqual(
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/Download Statistics.*react/i)
            })
          ])
        })
      );
    });

    it("should validate period parameter", async () => {
      const handler = analysisTools.handlers.get("download_stats");
      expect(handler).toBeDefined();

      await expect(handler!({
        packageName: "react",
        period: "invalid-period"
      })).rejects.toThrow();
    });
  });

  describe("Bundle Size Integration", () => {
    beforeEach(() => {
      // Setup mock for bundle size API
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          size: 24000,
          gzip: 7000,
          dependencyCount: 5
        })
      } as any);
    });

    it("should analyze bundle size", async () => {
      const handler = analysisTools.handlers.get("check_bundle_size");
      expect(handler).toBeDefined();

      const result = await handler!({
        packageName: "lodash"
      });

      expect(result).toEqual(
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/Bundle Size Analysis/i)
            })
          ])
        })
      );
    });

    it("should handle specific version analysis", async () => {
      const handler = analysisTools.handlers.get("check_bundle_size");
      expect(handler).toBeDefined();

      const result = await handler!({
        packageName: "lodash",
        version: "4.17.21"
      });

      expect(result).toEqual(
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/Bundle Size Analysis/i)
            })
          ])
        })
      );
    });
  });

  describe("Complete Workflow Integration", () => {
    it("should handle a complete package analysis workflow", async () => {
      const packageName = "typescript";

      // Setup specific mock for typescript search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          objects: [
            {
              package: {
                name: 'typescript',
                version: '5.1.6',
                description: 'TypeScript is a language for application scale JavaScript development',
                keywords: ['typescript', 'language'],
                author: 'Microsoft',
                date: '2023-06-20T00:00:00.000Z'
              },
              score: { final: 0.98 },
              searchScore: 100000
            }
          ]
        })
      } as any);

      // 1. Search for a package
      const searchHandler = searchTools.handlers.get("search_packages");
      const searchResult = await searchHandler!({
        query: packageName,
        limit: 1
      });

      expect(searchResult.content[0].text).toMatch(/🔍 Search results for.*typescript/i);

      // 2. Get package information
      // Setup specific mock for typescript package info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          name: 'typescript',
          "dist-tags": { latest: '5.1.6' },
          versions: {
            '5.1.6': {
              name: 'typescript',
              version: '5.1.6',
              description: 'TypeScript is a language for application scale JavaScript development',
              homepage: 'https://www.typescriptlang.org/',
              repository: { type: 'git', url: 'https://github.com/Microsoft/TypeScript.git' },
              license: 'Apache-2.0',
              author: 'Microsoft Corp.',
              dependencies: {},
              devDependencies: {},
              keywords: ['typescript', 'language']
            }
          },
          time: { '5.1.6': '2023-06-20T00:00:00.000Z' }
        })
      } as any);

      const infoHandler = managementTools.handlers.get("package_info");
      const infoResult = await infoHandler!({
        packageName
      });

      expect(infoResult.content[0].text).toMatch(/Package Information.*typescript/i);

      // 3. Check bundle size
      // Setup specific mock for bundle size
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          size: 50000000,
          gzip: 15000000,
          dependencyCount: 0
        })
      } as any);

      const bundleHandler = analysisTools.handlers.get("check_bundle_size");
      const bundleResult = await bundleHandler!({
        packageName
      });

      expect(bundleResult.content[0].text).toMatch(/Bundle Size Analysis/i);

      // 4. Get download statistics  
      // Setup specific mock for download stats
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          downloads: 10000000,
          start: '2023-07-01',
          end: '2023-07-31'
        })
      } as any);

      const statsHandler = analysisTools.handlers.get("download_stats");
      const statsResult = await statsHandler!({
        packageName,
        period: "last-month"
      });

      expect(statsResult.content[0].text).toMatch(/Download Statistics.*typescript/i);

      // 5. Check for vulnerabilities
      const vulnHandler = securityTools.handlers.get("check_vulnerability");
      const vulnResult = await vulnHandler!({
        packageName
      });

      expect(vulnResult.content[0].text).toBeDefined();
    }, 30000); // Longer timeout for complete workflow
  });

  describe("Error Handling Integration", () => {
    it("should handle network errors gracefully", async () => {
      // Mock fetch to throw a network error
      mockFetch.mockRejectedValue(new Error('ENOTFOUND registry.npmjs.org'));

      const handler = managementTools.handlers.get("package_info");
      expect(handler).toBeDefined();

      // Test with any package name when network fails
      const result = await handler!({
        packageName: "any-package"
      });

      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "text",
              text: expect.stringMatching(/Failed to get package info/i)
            })
          ])
        })
      );
    });

    it("should validate input schemas", async () => {
      const handler = searchTools.handlers.get("search_packages");
      expect(handler).toBeDefined();

      // Test with invalid input
      await expect(handler!({
        query: 123, // invalid type
        limit: "not-a-number" // invalid type
      })).rejects.toThrow();
    });
  });
});