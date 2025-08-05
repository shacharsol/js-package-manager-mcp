/**
 * Production Integration Tests for MCP Server
 * 
 * Tests all MCP operations through the Netlify function endpoints to ensure
 * production functionality works correctly. These tests simulate real-world usage.
 */

import { describe, it, expect } from '@jest/globals';

// Import the actual Netlify function
const npmPlusMcp = require('../../netlify/functions/npmplus-mcp.cjs');

describe('MCP Production Integration Tests', () => {
  const createEvent = (method: string, body?: any) => ({
    httpMethod: method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'test-client'
    },
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: null,
    path: '/npmplus-mcp',
    isBase64Encoded: false
  });

  const createContext = () => ({
    functionName: 'npmplus-mcp',
    functionVersion: '1',
    invokedFunctionArn: 'test',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: 'test-log-group',
    logStreamName: 'test-stream',
    identity: null,
    clientContext: null
  });

  describe('Server Capabilities', () => {
    it('should handle initialize request correctly', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.capabilities).toBeDefined();
      expect(response.result.serverInfo).toBeDefined();
      expect(response.result.serverInfo.name).toBe('npmplus-mcp');
      expect(response.result.serverInfo.version).toBe('11.0.1');
    });

    it('should list all available tools', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeDefined();
      expect(Array.isArray(response.result.tools)).toBe(true);
      
      // Check that all expected tools are present
      const toolNames = response.result.tools.map((tool: any) => tool.name);
      const expectedTools = [
        'search_packages',
        'install_packages', 
        'update_packages',
        'remove_packages',
        'check_outdated',
        'dependency_tree',
        'check_bundle_size',
        'analyze_dependencies', 
        'download_stats',
        'audit_dependencies',
        'check_vulnerability',
        'list_licenses',
        'check_license',
        'clean_cache',
        'package_info'
      ];

      expectedTools.forEach(toolName => {
        expect(toolNames).toContain(toolName);
      });
    });
  });

  describe('Search Operations', () => {
    it('should search for packages successfully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            query: 'lodash',
            limit: 5
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
      expect(Array.isArray(response.result.content)).toBe(true);
      expect(response.result.content.length).toBeGreaterThan(0);
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Search results');
    }, 15000); // Allow longer timeout for network requests

    it('should handle empty search results', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            query: 'thispackagereallydoesnotexist12345',
            limit: 5
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('No packages found');
    }, 15000);
  });

  describe('Package Information', () => {
    it('should get package information successfully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'lodash'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Package Information');
      expect(textContent).toContain('lodash');
      expect(textContent).toContain('Version:');
      expect(textContent).toContain('License:');
    }, 15000);

    it('should handle non-existent package gracefully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'this-package-absolutely-does-not-exist-12345'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.isError).toBe(true);
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('not found');
    }, 15000);
  });

  describe('Bundle Size Analysis', () => {
    it('should analyze bundle size successfully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'check_bundle_size',
          arguments: {
            packageName: 'lodash'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Bundle Size Analysis');
      expect(textContent).toContain('lodash');
    }, 15000);
  });

  describe('Download Statistics', () => {
    it('should get download statistics successfully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'download_stats',
          arguments: {
            packageName: 'lodash',
            period: 'last-week'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Download Statistics');
      expect(textContent).toContain('lodash');
      expect(textContent).toContain('Downloads:');
    }, 15000);
  });

  describe('License Information', () => {
    it('should check package license successfully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'check_license',
          arguments: {
            packageName: 'lodash'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('License Information');
      expect(textContent).toContain('lodash');
    }, 15000);
  });

  describe('Security Operations', () => {
    it('should check package vulnerability successfully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: {
          name: 'check_vulnerability',
          arguments: {
            packageName: 'lodash'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Vulnerability Check');
      expect(textContent).toContain('lodash');
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid tool name', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: {
          name: 'invalid_tool_name',
          arguments: {}
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.isError).toBe(true);
    });

    it('should handle malformed JSON requests', async () => {
      const event = createEvent('POST');
      event.body = '{ invalid json }';

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(400);
      
      const response = JSON.parse(result.body);
      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Invalid JSON');
    });

    it('should handle missing required parameters', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            // Missing required 'query' parameter
            limit: 5
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.isError).toBe(true);
    });
  });

  describe('CORS and HTTP Methods', () => {
    it('should handle CORS preflight requests', async () => {
      const event = createEvent('OPTIONS');

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('should handle GET requests for service discovery', async () => {
      const event = createEvent('GET');

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.name).toBe('npmplus-mcp');
      expect(response.version).toBe('11.0.1');
    });

    it('should reject unsupported HTTP methods', async () => {
      const event = createEvent('DELETE');

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(405);
      
      const response = JSON.parse(result.body);
      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Method not allowed');
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete requests within reasonable time', async () => {
      const start = Date.now();
      
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 13,
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            query: 'react',
            limit: 5
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      const duration = Date.now() - start;
      
      expect(result.statusCode).toBe(200);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    }, 20000);

    it('should handle concurrent requests gracefully', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        npmPlusMcp.handler(
          createEvent('POST', {
            jsonrpc: '2.0',
            id: 100 + i,
            method: 'tools/call',
            params: {
              name: 'package_info',
              arguments: {
                packageName: ['lodash', 'react', 'vue', 'angular', 'express'][i]
              }
            }
          }),
          createContext()
        )
      );

      const results = await Promise.all(requests);
      
      results.forEach(result => {
        expect(result.statusCode).toBe(200);
        const response = JSON.parse(result.body);
        expect(response.result).toBeDefined();
      });
    }, 30000);
  });

  describe('Cache Functionality', () => {
    it('should return consistent results for repeated requests', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 14,
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'lodash'
          }
        }
      });

      const result1 = await npmPlusMcp.handler(event, createContext());
      const result2 = await npmPlusMcp.handler(event, createContext());
      
      expect(result1.statusCode).toBe(200);
      expect(result2.statusCode).toBe(200);
      
      const response1 = JSON.parse(result1.body);
      const response2 = JSON.parse(result2.body);
      
      // Results should be consistent
      expect(response1.result.content[0].text).toBe(response2.result.content[0].text);
    }, 20000);
  });
});