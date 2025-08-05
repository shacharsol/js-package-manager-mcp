/**
 * Test suite for tools that provide guidance in hosted service mode
 */

import { describe, it, expect } from '@jest/globals';

// Import the actual Netlify function
const npmPlusMcp = require('../../netlify/functions/npmplus-mcp.cjs');

describe('Tool Guidance Integration Tests', () => {
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

  describe('Local File System Tools - Guidance Mode', () => {
    it('should provide guidance for check_outdated', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'check_outdated',
          arguments: {
            cwd: '/tmp'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      expect(response.result.isError).toBeUndefined(); // Should not be an error
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Popular Package Versions');
      expect(textContent).toContain('npm outdated');
      expect(textContent).toContain('To check YOUR packages');
    });

    it('should provide guidance for dependency_tree', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'dependency_tree',
          arguments: {
            cwd: '/tmp',
            depth: 2
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Dependency Tree');
      expect(textContent).toContain('npm list');
      expect(textContent).toContain('--depth=0');
    });

    it('should provide guidance for analyze_dependencies', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'analyze_dependencies',
          arguments: {
            cwd: '/tmp',
            circular: true,
            orphans: true
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Dependency Analysis');
      expect(textContent).toContain('npm dedupe');
      expect(textContent).toContain('check_bundle_size');
    });

    it('should provide guidance for list_licenses', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'list_licenses',
          arguments: {
            cwd: '/tmp'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('License Information');
      expect(textContent).toContain('license-checker');
      expect(textContent).toContain('check_license');
    });

    it('should provide guidance for clean_cache', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'clean_cache',
          arguments: {
            cwd: '/tmp'
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Cache Management');
      expect(textContent).toContain('npm cache clean');
      expect(textContent).toContain('yarn cache clean');
      expect(textContent).toContain('pnpm store prune');
    });

    it('should provide improved guidance for audit_dependencies', async () => {
      const event = createEvent('POST', {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'audit_dependencies',
          arguments: {
            cwd: '/tmp',
            fix: false
          }
        }
      });

      const result = await npmPlusMcp.handler(event, createContext());
      
      expect(result.statusCode).toBe(200);
      
      const response = JSON.parse(result.body);
      expect(response.result).toBeDefined();
      
      const textContent = response.result.content[0].text;
      expect(textContent).toContain('Security Audit Guidance');
      expect(textContent).toContain('npm audit');
      expect(textContent).toContain('check_vulnerability');
    });
  });
});