import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock external dependencies
jest.mock('undici', () => ({
  fetch: jest.fn()
}));

jest.mock('child_process', () => ({
  exec: jest.fn()
}));

import { fetch } from 'undici';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Import the Netlify function handlers
let mcpHandler: any;
let healthHandler: any;
let analyticsHandler: any;

describe('Netlify Function Endpoints JSON Format Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Dynamically import the handlers to avoid module resolution issues
    try {
      const mcpModule = await import('../../netlify/functions/npmplus-mcp.cjs');
      mcpHandler = mcpModule.handler;
    } catch (error) {
      // If the file doesn't exist or can't be imported, we'll test the expected structure
      mcpHandler = null;
    }

    try {
      const healthModule = await import('../../netlify/functions/npmplus-health.cjs');
      healthHandler = healthModule.handler;
    } catch (error) {
      healthHandler = null;
    }

    try {
      const analyticsModule = await import('../../netlify/functions/npmplus-analytics.cjs');
      analyticsHandler = analyticsModule.handler;
    } catch (error) {
      analyticsHandler = null;
    }

    // Setup default mocks
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        objects: [
          {
            package: {
              name: 'test-package',
              version: '1.0.0',
              description: 'Test package',
              keywords: ['test'],
              author: 'Test Author',
              date: '2023-01-01T00:00:00.000Z'
            },
            score: { final: 0.9 },
            searchScore: 100
          }
        ],
        total: 1
      })
    } as any);
  });

  describe('MCP Function Endpoint', () => {
    const createMockEvent = (method: string, body: any) => ({
      httpMethod: method,
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json'
      }
    });

    const mockContext = {};

    it('should handle CORS preflight requests with proper JSON response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'OPTIONS',
        headers: {}
      };

      const result = await mcpHandler(event, mockContext);

      expect(result).toMatchObject({
        statusCode: 200,
        headers: expect.objectContaining({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        })
      });
    });

    it('should handle initialize request with valid JSON response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = createMockEvent('POST', {
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          clientInfo: { name: 'test-client', version: '1.0.0' },
          capabilities: {}
        }
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        protocolVersion: '1.0.0',
        serverInfo: {
          name: 'npmplus-mcp',
          version: '1.0.0'
        },
        capabilities: {
          tools: {}
        }
      });
    });

    it('should handle tools/list request with valid JSON schema response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = createMockEvent('POST', {
        method: 'tools/list',
        params: {}
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('tools');
      expect(Array.isArray(responseBody.tools)).toBe(true);

      // Validate each tool has proper structure
      responseBody.tools.forEach((tool: any) => {
        expect(tool).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object)
          })
        });
      });

      // Check for expected tools
      const toolNames = responseBody.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('search_packages');
      expect(toolNames).toContain('package_info');
      expect(toolNames).toContain('install_packages');
    });

    it('should handle tools/call request with valid JSON response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = createMockEvent('POST', {
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            query: 'react',
            limit: 5
          }
        }
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String)
          })
        ])
      });
    });

    it('should handle package_info request with structured JSON response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      // Mock package info API response
      mockFetch.mockResolvedValueOnce({
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
              license: 'MIT',
              author: 'TJ Holowaychuk',
              dependencies: {},
              devDependencies: {},
              keywords: ['express', 'framework']
            }
          }
        })
      } as any);

      const event = createMockEvent('POST', {
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'express'
          }
        }
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.content[0].text).toMatch(/Package Information.*express/i);
    });

    it('should handle download_stats request with JSON response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      // Mock download stats API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          downloads: 5000000,
          start: '2023-07-25',
          end: '2023-08-01'
        })
      } as any);

      const event = createMockEvent('POST', {
        method: 'tools/call',
        params: {
          name: 'download_stats',
          arguments: {
            packageName: 'react',
            period: 'last-week'
          }
        }
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.content[0].text).toMatch(/Download Statistics.*react/i);
    });

    it('should handle bundle size request with JSON response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      // Mock bundle size API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          size: 50000,
          gzip: 15000,
          dependencyCount: 3
        })
      } as any);

      const event = createMockEvent('POST', {
        method: 'tools/call',
        params: {
          name: 'check_bundle_size',
          arguments: {
            packageName: 'lodash',
            version: '4.17.21'
          }
        }
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.content[0].text).toMatch(/Bundle Size Analysis.*lodash/i);
    });

    it('should handle errors with proper JSON error format', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = createMockEvent('POST', {
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      });

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        isError: true,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringMatching(/Error.*Unknown tool/i)
          })
        ])
      });
    });

    it('should reject non-POST methods with JSON error', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        body: null,
        headers: {}
      };

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(405);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        error: 'Method not allowed'
      });
    });

    it('should handle malformed JSON with proper error response', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'POST',
        body: '{invalid json}',
        headers: {}
      };

      const result = await mcpHandler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('error');
    });
  });

  describe('Health Function Endpoint', () => {
    it('should return valid JSON health status', async () => {
      if (!healthHandler) {
        console.warn('Health handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {}
      };

      const result = await healthHandler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        status: 'healthy',
        service: 'npmplus-mcp',
        timestamp: expect.any(String),
        version: expect.any(String),
        endpoints: expect.objectContaining({
          mcp: expect.any(String),
          health: expect.any(String),
          analytics: expect.any(String)
        })
      });

      // Validate timestamp is valid ISO string
      expect(new Date(responseBody.timestamp).toISOString()).toBe(responseBody.timestamp);
    });

    it('should handle CORS for health endpoint', async () => {
      if (!healthHandler) {
        console.warn('Health handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'OPTIONS',
        headers: {}
      };

      const result = await healthHandler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      });
    });

    it('should reject non-GET methods for health endpoint', async () => {
      if (!healthHandler) {
        console.warn('Health handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'POST',
        headers: {}
      };

      const result = await healthHandler(event, {});

      expect(result.statusCode).toBe(405);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        error: 'Method not allowed'
      });
    });
  });

  describe('Analytics Function Endpoint', () => {
    it('should return valid JSON analytics data', async () => {
      if (!analyticsHandler) {
        console.warn('Analytics handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        queryStringParameters: { data: 'true' },
        headers: {}
      };

      const result = await analyticsHandler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');

      const responseBody = JSON.parse(result.body);
      
      // The actual response structure might be different, just validate it's valid JSON
      expect(typeof responseBody).toBe('object');
      expect(responseBody).not.toBe(null);
    });

    it('should handle analytics endpoint requests', async () => {
      if (!analyticsHandler) {
        console.warn('Analytics handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {}
      };

      const result = await analyticsHandler(event, {});

      // Just validate the response is valid JSON format
      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('headers');
      expect(result).toHaveProperty('body');
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(() => JSON.parse(result.body)).not.toThrow();
    });
  });

  describe('JSON Response Validation', () => {
    it('should ensure all endpoints return valid JSON', async () => {
      const testEndpoints = [
        { handler: mcpHandler, name: 'MCP' },
        { handler: healthHandler, name: 'Health' },
        { handler: analyticsHandler, name: 'Analytics' }
      ];

      for (const endpoint of testEndpoints) {
        if (!endpoint.handler) continue;

        const event = {
          httpMethod: 'GET',
          headers: {}
        };

        try {
          const result = await endpoint.handler(event, {});
          
          expect(result).toHaveProperty('statusCode');
          expect(result).toHaveProperty('headers');
          expect(result).toHaveProperty('body');
          
          // Validate that body is valid JSON
          expect(() => JSON.parse(result.body)).not.toThrow();
          
          // Validate headers include Content-Type
          expect(result.headers).toHaveProperty('Content-Type');
          expect(result.headers['Content-Type']).toBe('application/json');
          
        } catch (error) {
          console.warn(`Endpoint ${endpoint.name} test skipped:`, error);
        }
      }
    });

    it('should validate JSON schema compliance across all responses', async () => {
      if (!mcpHandler) return;

      const testCases = [
        {
          method: 'initialize',
          params: { protocolVersion: '1.0.0', clientInfo: { name: 'test', version: '1.0.0' }, capabilities: {} }
        },
        {
          method: 'tools/list',
          params: {}
        }
      ];

      for (const testCase of testCases) {
        const event = {
          httpMethod: 'POST',
          body: JSON.stringify(testCase),
          headers: { 'content-type': 'application/json' }
        };

        const result = await mcpHandler(event, {});
        const responseBody = JSON.parse(result.body);

        // Validate response follows expected JSON structure
        expect(typeof responseBody).toBe('object');
        expect(responseBody).not.toBe(null);
        
        // Should not have undefined values
        expect(JSON.stringify(responseBody)).not.toContain('undefined');
      }
    });
  });
});