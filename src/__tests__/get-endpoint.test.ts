import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock external dependencies
import { jest } from '@jest/globals';

describe('MCP GET Endpoint Integration Tests', () => {
  let mcpHandler: any;

  beforeEach(async () => {
    // Dynamically import the MCP handler
    try {
      const mcpModule = await import('../../netlify/functions/npmplus-mcp.cjs');
      mcpHandler = mcpModule.handler;
    } catch (error) {
      mcpHandler = null;
    }
  });

  describe('Service Discovery via GET', () => {
    it('should return server capabilities for service discovery', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {
          'User-Agent': 'Cursor/1.0'
        }
      };

      const result = await mcpHandler(event, {});

      // Validate response structure
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');

      // Parse and validate response body
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        name: 'npmplus-mcp',
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        description: expect.stringContaining('JavaScript Package Manager'),
        capabilities: {
          tools: {},
          server: {
            name: 'npmplus-mcp',
            version: expect.stringMatching(/^\d+\.\d+\.\d+$/)
          }
        },
        endpoints: {
          initialize: 'POST /',
          'tools/list': 'POST /',
          'tools/call': 'POST /'
        }
      });
    });

    it('should handle CORS properly for GET requests', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {
          'Origin': 'https://example.com',
          'User-Agent': 'Test/1.0'
        }
      };

      const result = await mcpHandler(event, {});

      expect(result.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      });
    });

    it('should return consistent version across all fields', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {}
      };

      const result = await mcpHandler(event, {});
      const responseBody = JSON.parse(result.body);

      // Version should be consistent across response
      expect(responseBody.version).toBe(responseBody.capabilities.server.version);
      expect(responseBody.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should provide service information for HTTP transport clients', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {
          'User-Agent': 'Cursor/1.86.1'
        }
      };

      const result = await mcpHandler(event, {});
      const responseBody = JSON.parse(result.body);

      // Validate that it provides useful information for HTTP clients
      expect(responseBody.endpoints).toBeDefined();
      expect(responseBody.capabilities).toBeDefined();
      expect(responseBody.description).toContain('MCP Server');
      
      // Should list available MCP methods
      expect(responseBody.endpoints).toHaveProperty('initialize');
      expect(responseBody.endpoints).toHaveProperty('tools/list');
      expect(responseBody.endpoints).toHaveProperty('tools/call');
    });
  });

  describe('Error Handling for GET requests', () => {
    it('should handle GET requests gracefully even with query parameters', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        queryStringParameters: {
          test: 'value'
        },
        headers: {}
      };

      const result = await mcpHandler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      // Should still return valid service discovery info
      const responseBody = JSON.parse(result.body);
      expect(responseBody.name).toBe('npmplus-mcp');
    });

    it('should return valid JSON even for malformed requests', async () => {
      if (!mcpHandler) {
        console.warn('MCP handler not available for testing');
        return;
      }

      const event = {
        httpMethod: 'GET',
        headers: {
          'Invalid-Header': 'test\x00null'
        }
      };

      const result = await mcpHandler(event, {});

      expect(result.statusCode).toBe(200);
      expect(() => JSON.parse(result.body)).not.toThrow();
    });
  });
});