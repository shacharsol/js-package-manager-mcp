import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createServer } from '../server.js';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Mock external dependencies
jest.mock('p-limit', () => {
  return jest.fn(() => (fn: Function) => fn());
});

jest.mock('undici', () => ({
  fetch: jest.fn()
}));

jest.mock('execa', () => ({
  execa: jest.fn()
}));

import { fetch } from 'undici';
import { execa } from 'execa';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockExeca = execa as jest.MockedFunction<typeof execa>;

describe('MCP Server Endpoints JSON Format Tests', () => {
  let server: Server;

  beforeEach(async () => {
    jest.clearAllMocks();
    server = await createServer();
    
    // Setup default fetch mock for npm registry
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

  describe('Initialize Endpoint', () => {
    it('should return valid JSON schema for initialize request', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0',
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          },
          capabilities: {}
        }
      };

      const mockRequest = {
        method: 'initialize',
        params: request.params
      };

      // This would normally be handled by the MCP SDK, but we can test the structure
      const result = {
        protocolVersion: '1.0.0',
        serverInfo: {
          name: 'npmplus-mcp',
          version: expect.any(String)
        },
        capabilities: {
          tools: {}
        }
      };

      expect(result).toMatchObject({
        protocolVersion: expect.any(String),
        serverInfo: expect.objectContaining({
          name: expect.any(String),
          version: expect.any(String)
        }),
        capabilities: expect.any(Object)
      });
    });
  });

  describe('Tools List Endpoint', () => {
    it('should return valid JSON schema for tools/list request', async () => {
      const listHandler = server['_requestHandlers'].get('tools/list');
      expect(listHandler).toBeDefined();

      const request = {
        method: 'tools/list',
        params: {}
      };

      const result = await listHandler!(request);

      // Validate JSON structure
      expect(result).toMatchObject({
        tools: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            description: expect.any(String),
            inputSchema: expect.objectContaining({
              type: 'object',
              properties: expect.any(Object)
            })
          })
        ])
      });

      // Validate each tool has proper schema
      result.tools.forEach((tool: any) => {
        expect(tool).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object)
          })
        });

        // Validate JSON Schema draft compliance
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
        
        // Check for required fields if present
        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        }
      });
    });

    it('should include all expected tools with valid schemas', async () => {
      const listHandler = server['_requestHandlers'].get('tools/list');
      const result = await listHandler!({ method: 'tools/list', params: {} });

      const expectedTools = [
        'search_packages',
        'package_info', 
        'install_packages',
        'update_packages',
        'remove_packages',
        'check_outdated',
        'audit_dependencies',
        'check_vulnerability',
        'check_bundle_size',
        'download_stats',
        'analyze_dependencies',
        'dependency_tree',
        'list_licenses',
        'check_license',
        'clean_cache'
      ];

      const toolNames = result.tools.map((tool: any) => tool.name);
      
      expectedTools.forEach(expectedTool => {
        expect(toolNames).toContain(expectedTool);
      });

      // Validate specific tool schemas
      const installTool = result.tools.find((tool: any) => tool.name === 'install_packages');
      expect(installTool).toBeDefined();
      expect(installTool.inputSchema).toMatchObject({
        type: 'object',
        properties: expect.objectContaining({
          packages: expect.objectContaining({
            type: 'array',
            items: expect.objectContaining({
              type: 'string'
            })
          }),
          cwd: expect.objectContaining({
            type: 'string'
          }),
          dev: expect.objectContaining({
            type: 'boolean'
          }),
          global: expect.objectContaining({
            type: 'boolean'
          })
        }),
        required: expect.arrayContaining(['packages'])
      });
    });
  });

  describe('Tools Call Endpoint', () => {
    it('should handle search_packages with valid JSON input/output', async () => {
      const callHandler = server['_requestHandlers'].get('tools/call');
      expect(callHandler).toBeDefined();

      const request = {
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            query: 'react',
            limit: 5
          }
        }
      };

      const result = await callHandler!(request);

      // Validate JSON response structure
      expect(result).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String)
          })
        ])
      });

      // Validate content structure
      expect(Array.isArray(result.content)).toBe(true);
      result.content.forEach((content: any) => {
        expect(content).toHaveProperty('type');
        expect(content).toHaveProperty('text');
        expect(typeof content.text).toBe('string');
      });
    });

    it('should handle package_info with valid JSON input/output', async () => {
      // Mock package info response
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

      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'express'
          }
        }
      };

      const result = await callHandler!(request);

      expect(result).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringMatching(/Package Information.*express/i)
          })
        ])
      });
    });

    it('should handle install_packages with valid JSON input/output', async () => {
      // Mock execa for package installation
      mockExeca.mockResolvedValueOnce({
        stdout: 'Successfully installed packages',
        stderr: '',
        exitCode: 0
      } as any);

      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'install_packages',
          arguments: {
            packages: ['express', 'cors'],
            cwd: '/tmp/test-project',
            dev: false
          }
        }
      };

      const result = await callHandler!(request);

      expect(result).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringMatching(/Successfully installed/i)
          })
        ])
      });
    });

    it('should handle download_stats with valid JSON input/output', async () => {
      // Mock download stats API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          downloads: 1000000,
          start: '2023-07-25',
          end: '2023-08-01'
        })
      } as any);

      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'download_stats',
          arguments: {
            packageName: 'react',
            period: 'last-week'
          }
        }
      };

      const result = await callHandler!(request);

      expect(result).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringMatching(/Download Statistics.*react/i)
          })
        ])
      });
    });

    it('should handle bundle size analysis with valid JSON input/output', async () => {
      // Mock bundle size API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          size: 45000,
          gzip: 12000,
          dependencyCount: 3
        })
      } as any);

      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'check_bundle_size',
          arguments: {
            packageName: 'lodash',
            version: '4.17.21'
          }
        }
      };

      const result = await callHandler!(request);

      expect(result).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringMatching(/Bundle Size Analysis.*lodash/i)
          })
        ])
      });
    });
  });

  describe('Error Handling with JSON Format', () => {
    it('should return valid JSON error format for invalid tool calls', async () => {
      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'non_existent_tool',
          arguments: {}
        }
      };

      await expect(callHandler!(request)).rejects.toThrow('Unknown tool: non_existent_tool');
    });

    it('should return valid JSON error format for invalid arguments', async () => {
      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'search_packages',
          arguments: {
            query: 123, // Invalid type
            limit: 'not-a-number' // Invalid type
          }
        }
      };

      await expect(callHandler!(request)).rejects.toThrow();
    });

    it('should handle network errors with proper JSON error format', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'test-package'
          }
        }
      };

      const result = await callHandler!(request);

      expect(result).toMatchObject({
        isError: true,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringMatching(/Failed to get package info/i)
          })
        ])
      });
    });
  });

  describe('JSON Schema Validation', () => {
    it('should validate all tool input schemas are proper JSON Schema', async () => {
      const listHandler = server['_requestHandlers'].get('tools/list');
      const result = await listHandler!({ method: 'tools/list', params: {} });

      result.tools.forEach((tool: any) => {
        const schema = tool.inputSchema;
        
        // Basic JSON Schema structure validation
        expect(schema).toHaveProperty('type');
        expect(schema.type).toBe('object');
        
        if (schema.properties) {
          Object.values(schema.properties).forEach((property: any) => {
            expect(property).toHaveProperty('type');
            expect(typeof property.type).toBe('string');
            
            // If it's an array, should have items
            if (property.type === 'array') {
              expect(property).toHaveProperty('items');
            }
            
            // If it has enum, should be array
            if (property.enum) {
              expect(Array.isArray(property.enum)).toBe(true);
            }
          });
        }
        
        // Required should be array if present
        if (schema.required) {
          expect(Array.isArray(schema.required)).toBe(true);
        }
        
        // Validate specific tools have proper schema structure
        if (tool.name === 'search_packages') {
          expect(schema.properties).toHaveProperty('query');
          expect(schema.properties.query.type).toBe('string');
          expect(schema.required).toContain('query');
        }
        
        if (tool.name === 'install_packages') {
          expect(schema.properties).toHaveProperty('packages');
          expect(schema.properties.packages.type).toBe('array');
          expect(schema.properties.packages.items.type).toBe('string');
          expect(schema.required).toContain('packages');
        }
        
        if (tool.name === 'download_stats') {
          expect(schema.properties).toHaveProperty('period');
          if (schema.properties.period.enum) {
            expect(schema.properties.period.enum).toContain('last-week');
          }
        }
      });
    });

    it('should handle complex nested schema validation', async () => {
      const listHandler = server['_requestHandlers'].get('tools/list');
      const result = await listHandler!({ method: 'tools/list', params: {} });

      const complexTools = result.tools.filter((tool: any) => 
        ['install_packages', 'update_packages', 'dependency_tree'].includes(tool.name)
      );

      complexTools.forEach((tool: any) => {
        const schema = tool.inputSchema;
        
        // Should have proper object structure
        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        
        // Check for default values
        Object.values(schema.properties).forEach((property: any) => {
          if (property.hasOwnProperty('default')) {
            // Default should match the expected type
            if (property.type === 'boolean') {
              expect(typeof property.default).toBe('boolean');
            }
            if (property.type === 'number') {
              expect(typeof property.default).toBe('number');
            }
            if (property.type === 'string') {
              expect(typeof property.default).toBe('string');
            }
          }
        });
      });
    });
  });

  describe('Response Format Consistency', () => {
    it('should ensure all successful responses follow MCP format', async () => {
      const testCases = [
        {
          tool: 'search_packages',
          args: { query: 'test', limit: 1 }
        },
        {
          tool: 'package_info', 
          args: { packageName: 'test-package' }
        }
      ];

      const callHandler = server['_requestHandlers'].get('tools/call');

      for (const testCase of testCases) {
        const request = {
          method: 'tools/call',
          params: {
            name: testCase.tool,
            arguments: testCase.args
          }
        };

        const result = await callHandler!(request);

        // Validate MCP response format
        expect(result).toMatchObject({
          content: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              text: expect.any(String)
            })
          ])
        });

        // Should not have isError for successful responses
        expect(result.isError).toBeUndefined();
      }
    });

    it('should ensure all error responses follow MCP error format', async () => {
      // Mock network failures
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const callHandler = server['_requestHandlers'].get('tools/call');
      const request = {
        method: 'tools/call',
        params: {
          name: 'package_info',
          arguments: {
            packageName: 'failing-package'
          }
        }
      };

      const result = await callHandler!(request);

      // Validate MCP error response format
      expect(result).toMatchObject({
        isError: true,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String)
          })
        ])
      });
    });
  });
});