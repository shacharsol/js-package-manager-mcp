import { z } from 'zod';

/**
 * Common response types for MCP tools
 */
export interface MCPContent {
  type: 'text';
  text: string;
}

export interface MCPResponse {
  content: MCPContent[];
  isError?: boolean;
}

/**
 * Creates a successful MCP response with formatted text
 */
export function createSuccessResponse(text: string): MCPResponse {
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  };
}

/**
 * Creates an error MCP response with formatted error message
 */
export function createErrorResponse(error: Error | string, context?: string): MCPResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  const text = context 
    ? `❌ ${context}: ${errorMessage}`
    : `❌ ${errorMessage}`;
    
  return {
    content: [
      {
        type: 'text',
        text
      }
    ],
    isError: true
  };
}

/**
 * Creates a formatted info response
 */
export function createInfoResponse(title: string, content: string): MCPResponse {
  return {
    content: [
      {
        type: 'text',
        text: `ℹ️ ${title}\n\n${content}`
      }
    ]
  };
}

/**
 * Creates a warning response
 */
export function createWarningResponse(warning: string): MCPResponse {
  return {
    content: [
      {
        type: 'text',
        text: `⚠️ ${warning}`
      }
    ]
  };
}