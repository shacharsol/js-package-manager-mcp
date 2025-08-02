import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

/**
 * Convert Zod schema to JSON Schema for MCP compatibility
 */
export function convertZodToJsonSchema(zodSchema: z.ZodType<any, any>): any {
  return zodToJsonSchema(zodSchema, {
    target: 'jsonSchema7',
    definitions: {}
  });
}

/**
 * Convert a tool definition with Zod schema to MCP-compatible format
 */
export function convertToolSchema(tool: {
  name: string;
  description: string;
  inputSchema: z.ZodType<any, any>;
}) {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: convertZodToJsonSchema(tool.inputSchema)
  };
}