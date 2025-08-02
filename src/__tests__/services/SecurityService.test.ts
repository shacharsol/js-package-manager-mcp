import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SecurityService } from '../../services/SecurityService.js';
import { URLS, NPM_ECOSYSTEM } from '../../constants.js';
import { SecuritySeverity } from '../../models/Package.js';

// Mock dependencies
jest.mock('undici', () => ({
  fetch: jest.fn()
}));

import { fetch } from 'undici';
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = new SecurityService();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default URLs when none provided', () => {
      const service = new SecurityService();
      expect(service).toBeInstanceOf(SecurityService);
    });

    it('should accept custom URLs', () => {
      const customGhUrl = 'https://custom-github.com/api';
      const customOsvUrl = 'https://custom-osv.com/v1';
      
      const service = new SecurityService(customGhUrl, customOsvUrl);
      expect(service).toBeInstanceOf(SecurityService);
    });
  });

  describe('checkVulnerabilities', () => {
    const mockGitHubResponse = [
      {
        ghsa_id: 'GHSA-test-1234',
        summary: 'Test vulnerability',
        severity: 'high',
        html_url: 'https://github.com/advisories/GHSA-test-1234',
        description: 'This is a test vulnerability',
        published_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        vulnerabilities: [
          {
            package: { ecosystem: 'npm', name: 'lodash' },
            ranges: [
              {
                events: [
                  { introduced: '0' },
                  { fixed: '4.17.21' }
                ]
              }
            ]
          }
        ]
      }
    ];

    const mockOSVResponse = {
      vulns: [
        {
          id: 'OSV-TEST-5678',
          summary: 'OSV test vulnerability',
          details: 'This is an OSV test vulnerability',
          published: '2023-01-01T00:00:00Z',
          modified: '2023-01-02T00:00:00Z',
          severity: [
            { type: 'CVSS_V3', score: '8.5' }
          ],
          affected: [
            {
              package: { ecosystem: 'npm', name: 'lodash' },
              ranges: [
                {
                  events: [
                    { introduced: '0' },
                    { fixed: '4.17.21' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    beforeEach(() => {
      // Mock GitHub Advisory API
      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockGitHubResponse)
          } as any);
        }
        // Mock OSV API
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockOSVResponse)
        } as any);
      });
    });

    it('should check vulnerabilities from multiple sources', async () => {
      const result = await securityService.checkVulnerabilities('lodash');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.hasVulnerabilities).toBe(true);
      expect(result.vulnerabilities.length).toBe(2);
      expect(result.severity).toBe('high');
    });

    it('should handle specific version checks', async () => {
      await securityService.checkVulnerabilities('lodash', '4.17.20');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('affects=lodash'),
        expect.any(Object)
      );
    });

    it('should deduplicate vulnerabilities with same ID', async () => {
      // Mock both services returning the same vulnerability ID
      const duplicateResponse = [
        {
          ghsa_id: 'SAME-ID-1234',
          summary: 'Duplicate vulnerability',
          severity: 'high',
          html_url: 'https://github.com/advisories/SAME-ID-1234',
          description: 'This is a duplicate vulnerability',
          published_at: '2023-01-01T00:00:00Z',
          vulnerabilities: [{ package: { ecosystem: 'npm', name: 'lodash' } }]
        }
      ];

      const duplicateOSVResponse = {
        vulns: [
          {
            id: 'SAME-ID-1234',
            summary: 'Duplicate vulnerability',
            details: 'This is a duplicate vulnerability',
            published: '2023-01-01T00:00:00Z',
            severity: [{ type: 'CVSS_V3', score: '8.0' }]
          }
        ]
      };

      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(duplicateResponse)
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(duplicateOSVResponse)
        } as any);
      });

      const result = await securityService.checkVulnerabilities('lodash');
      expect(result.vulnerabilities.length).toBe(1);
    });

    it('should handle GitHub API errors gracefully', async () => {
      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: false,
            status: 500
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOSVResponse)
        } as any);
      });

      const result = await securityService.checkVulnerabilities('lodash');
      expect(result.vulnerabilities.length).toBe(1); // Only OSV results
    });

    it('should handle OSV API errors gracefully', async () => {
      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGitHubResponse)
          } as any);
        }
        return Promise.resolve({
          ok: false,
          status: 500
        } as any);
      });

      const result = await securityService.checkVulnerabilities('lodash');
      expect(result.vulnerabilities.length).toBe(1); // Only GitHub results
    });

    it('should return no vulnerabilities when none found', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as any);
      });

      const result = await securityService.checkVulnerabilities('safe-package');
      expect(result.hasVulnerabilities).toBe(false);
      expect(result.vulnerabilities.length).toBe(0);
      expect(result.severity).toBe('info');
    });

    it('should handle GitHub 404 responses', async () => {
      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: false,
            status: 404
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vulns: [] })
        } as any);
      });

      const result = await securityService.checkVulnerabilities('lodash');
      expect(result.hasVulnerabilities).toBe(false);
    });
  });

  describe('severity mapping', () => {
    it('should map GitHub severities correctly', async () => {
      const testCases = [
        { severity: 'critical', expected: 'critical' as SecuritySeverity },
        { severity: 'high', expected: 'high' as SecuritySeverity },
        { severity: 'moderate', expected: 'moderate' as SecuritySeverity },
        { severity: 'medium', expected: 'moderate' as SecuritySeverity },
        { severity: 'low', expected: 'low' as SecuritySeverity },
        { severity: 'unknown', expected: 'info' as SecuritySeverity },
      ];

      for (const testCase of testCases) {
        const mockResponse = [{
          ghsa_id: 'TEST-1234',
          summary: 'Test vulnerability',
          severity: testCase.severity,
          html_url: 'https://github.com/advisories/TEST-1234',
          vulnerabilities: [{ package: { ecosystem: 'npm', name: 'test' } }]
        }];

        mockFetch.mockImplementation((url: any) => {
          if (url.includes('github')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve(mockResponse)
            } as any);
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ vulns: [] })
          } as any);
        });

        const result = await securityService.checkVulnerabilities('test');
        expect(result.vulnerabilities[0].severity).toBe(testCase.expected);
      }
    });

    it('should map OSV CVSS scores correctly', async () => {
      const testCases = [
        { score: '9.5', expected: 'critical' as SecuritySeverity },
        { score: '8.0', expected: 'high' as SecuritySeverity },
        { score: '5.5', expected: 'moderate' as SecuritySeverity },
        { score: '2.5', expected: 'low' as SecuritySeverity },
        { score: '0.0', expected: 'info' as SecuritySeverity },
      ];

      for (const testCase of testCases) {
        const mockOSVResponse = {
          vulns: [{
            id: 'OSV-TEST',
            summary: 'Test vulnerability',
            severity: [{ type: 'CVSS_V3', score: testCase.score }]
          }]
        };

        mockFetch.mockImplementation((url: any) => {
          if (url.includes('github')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([])
            } as any);
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOSVResponse)
          } as any);
        });

        const result = await securityService.checkVulnerabilities('test');
        expect(result.vulnerabilities[0].severity).toBe(testCase.expected);
      }
    });
  });

  describe('overall severity calculation', () => {
    it('should return highest severity from multiple vulnerabilities', async () => {
      const mockResponse = [
        {
          ghsa_id: 'CRITICAL-1',
          summary: 'Critical vulnerability',
          severity: 'critical',
          html_url: 'https://github.com/advisories/CRITICAL-1',
          vulnerabilities: [{ package: { ecosystem: 'npm', name: 'test' } }]
        },
        {
          ghsa_id: 'LOW-1',
          summary: 'Low vulnerability',
          severity: 'low',
          html_url: 'https://github.com/advisories/LOW-1',
          vulnerabilities: [{ package: { ecosystem: 'npm', name: 'test' } }]
        }
      ];

      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vulns: [] })
        } as any);
      });

      const result = await securityService.checkVulnerabilities('test');
      expect(result.severity).toBe('critical');
    });
  });

  describe('version comparison', () => {
    it('should correctly filter packages by version', async () => {
      const mockResponse = [{
        ghsa_id: 'VERSION-TEST',
        summary: 'Version-specific vulnerability',
        severity: 'high',
        html_url: 'https://github.com/advisories/VERSION-TEST',
        vulnerabilities: [{
          package: { ecosystem: 'npm', name: 'test-package' },
          ranges: [{
            events: [
              { introduced: '1.0.0' },
              { fixed: '1.2.0' }
            ]
          }]
        }]
      }];

      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vulns: [] })
        } as any);
      });

      // Test affected version
      const resultAffected = await securityService.checkVulnerabilities('test-package', '1.1.0');
      expect(resultAffected.hasVulnerabilities).toBe(true);

      // Test unaffected version
      const resultSafe = await securityService.checkVulnerabilities('test-package', '1.2.1');
      expect(resultSafe.hasVulnerabilities).toBe(false);
    });
  });

  describe('recommendation extraction', () => {
    it('should extract recommendations from GitHub advisory', async () => {
      const mockResponse = [{
        ghsa_id: 'REC-TEST',
        summary: 'Test vulnerability',
        severity: 'high',
        html_url: 'https://github.com/advisories/REC-TEST',
        description: 'Please upgrade to version 2.0.0 or later',
        vulnerabilities: [{ package: { ecosystem: 'npm', name: 'test' } }]
      }];

      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vulns: [] })
        } as any);
      });

      const result = await securityService.checkVulnerabilities('test');
      expect(result.vulnerabilities[0].recommendation).toBe('Upgrade to a patched version');
    });

    it('should provide default recommendation when none found', async () => {
      const mockResponse = [{
        ghsa_id: 'NO-REC-TEST',
        summary: 'Test vulnerability',
        severity: 'high',
        html_url: 'https://github.com/advisories/NO-REC-TEST',
        description: 'This is a vulnerability with no remediation steps mentioned',
        vulnerabilities: [{ package: { ecosystem: 'npm', name: 'test' } }]
      }];

      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vulns: [] })
        } as any);
      });

      const result = await securityService.checkVulnerabilities('test');
      expect(result.vulnerabilities[0].recommendation).toBe('Review advisory for specific recommendations');
    });
  });

  describe('affected versions extraction', () => {
    it('should extract affected version ranges from GitHub advisory', async () => {
      const mockResponse = [{
        ghsa_id: 'VERSION-RANGE-TEST',
        summary: 'Test vulnerability',
        severity: 'high',
        html_url: 'https://github.com/advisories/VERSION-RANGE-TEST',
        vulnerabilities: [{
          package: { ecosystem: 'npm', name: 'test' },
          ranges: [{
            events: [
              { introduced: '1.0.0' },
              { fixed: '1.2.0' }
            ]
          }]
        }]
      }];

      mockFetch.mockImplementation((url: any) => {
        if (url.includes('github')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockResponse)
          } as any);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ vulns: [] })
        } as any);
      });

      const result = await securityService.checkVulnerabilities('test');
      expect(result.vulnerabilities[0].versions).toContain('>=1.0.0');
      expect(result.vulnerabilities[0].versions).toContain('<1.2.0');
    });
  });

  describe('API request headers', () => {
    it('should send correct headers to GitHub API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      } as any);

      await securityService.checkVulnerabilities('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('github'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'npmplus-mcp-server/1.0.0'
          })
        })
      );
    });

    it('should send correct headers to OSV API', async () => {
      mockFetch.mockImplementation((url: any) => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(url.includes('github') ? [] : { vulns: [] })
        } as any);
      });

      await securityService.checkVulnerabilities('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('osv'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"ecosystem":"npm"')
        })
      );
    });
  });
});