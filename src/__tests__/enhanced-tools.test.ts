/**
 * Test enhanced functionality for tools that now do actual work
 */

import { describe, it, expect } from '@jest/globals';

const npmPlusMcp = require('../../netlify/functions/npmplus-mcp.cjs');

describe('Enhanced Tool Functionality Tests', () => {
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

  describe('check_outdated with package.json analysis', () => {
    it('should analyze provided package.json for outdated packages', async () => {
      const samplePackageJson = JSON.stringify({
        "name": "test-project",
        "dependencies": {
          "lodash": "4.17.20",  // Slightly outdated
          "react": "18.0.0"     // Likely outdated
        },
        "devDependencies": {
          "jest": "28.0.0"      // Check if outdated
        }
      });

      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'check_outdated',
          arguments: {
            packageJson: samplePackageJson
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Package Version Analysis');
      expect(textContent).toContain('packages analyzed');
      // Should contain either outdated packages or "up to date" message
      expect(textContent).toMatch(/outdated packages|up to date/);
    }, 15000);

    it('should provide guidance when no package.json or cwd provided', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'check_outdated',
          arguments: {}
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Check Outdated Packages');
      expect(textContent).toContain('packageJson');
      expect(textContent).toContain('cwd');
      expect(textContent).toContain('npm outdated');
    }, 10000);
  });

  describe('clean_cache with actual functionality', () => {
    it('should clear internal cache and provide useful information', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'clean_cache',
          arguments: {}
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('MCP Server internal cache has been cleared');
      expect(textContent).toContain('Cleared at:');
      expect(textContent).toContain('Package info cache: Cleared');
      expect(textContent).toContain('npm cache clean');
    });
  });

  describe('Error handling for enhanced tools', () => {
    it('should handle malformed package.json gracefully', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'check_outdated',
          arguments: {
            packageJson: '{ invalid json }'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Error analyzing packages');
    });
  });
});