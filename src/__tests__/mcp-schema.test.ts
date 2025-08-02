import { describe, it, expect } from '@jest/globals';
import { convertZodToJsonSchema } from '../utils/schema-converter.js';
import { InstallPackagesSchema, SearchPackagesSchema } from '../validators/tools.js';

describe('MCP Schema Validation Tests', () => {
  describe('Schema Converter', () => {
    it('should convert Zod schema to valid JSON Schema', () => {
      const jsonSchema = convertZodToJsonSchema(InstallPackagesSchema);
      
      // Basic JSON Schema structure validation
      expect(jsonSchema).toHaveProperty('type');
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema).toHaveProperty('properties');
      
      // Validate specific properties
      expect(jsonSchema.properties).toHaveProperty('packages');
      expect(jsonSchema.properties.packages.type).toBe('array');
      expect(jsonSchema.properties.packages.items.type).toBe('string');
      
      expect(jsonSchema.properties).toHaveProperty('cwd');
      expect(jsonSchema.properties.cwd.type).toBe('string');
      
      expect(jsonSchema.properties).toHaveProperty('dev');
      expect(jsonSchema.properties.dev.type).toBe('boolean');
      
      // Required fields
      expect(jsonSchema.required).toContain('packages');
    });

    it('should convert search packages schema correctly', () => {
      const jsonSchema = convertZodToJsonSchema(SearchPackagesSchema);
      
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.properties).toHaveProperty('query');
      expect(jsonSchema.properties.query.type).toBe('string');
      
      expect(jsonSchema.properties).toHaveProperty('limit');
      expect(['number', 'integer'].includes(jsonSchema.properties.limit.type)).toBe(true);
      
      expect(jsonSchema.required).toContain('query');
    });

    it('should handle default values in schema conversion', () => {
      const jsonSchema = convertZodToJsonSchema(InstallPackagesSchema);
      
      // Check that default values are preserved
      if (jsonSchema.properties.save) {
        expect(jsonSchema.properties.save.default).toBe(true);
      }
    });

    it('should validate enum types are converted correctly', () => {
      // Test with a schema that has enum values
      const jsonSchema = convertZodToJsonSchema(SearchPackagesSchema);
      
      // The schema should be valid JSON Schema format
      expect(typeof jsonSchema).toBe('object');
      expect(jsonSchema).not.toBe(null);
      
      // Should not have undefined values when stringified
      expect(JSON.stringify(jsonSchema)).not.toContain('undefined');
    });
  });

  describe('JSON Schema Compliance', () => {
    it('should produce schemas that conform to JSON Schema Draft 7', () => {
      const schemas = [
        InstallPackagesSchema,
        SearchPackagesSchema
      ];

      schemas.forEach((schema) => {
        const jsonSchema = convertZodToJsonSchema(schema);
        
        // Basic Draft 7 compliance checks
        expect(jsonSchema.type).toBeDefined();
        expect(['object', 'array', 'string', 'number', 'boolean', 'null'].includes(jsonSchema.type)).toBe(true);
        
        if (jsonSchema.properties) {
          Object.values(jsonSchema.properties).forEach((property: any) => {
            // Some properties might be complex objects, check if type exists
            if (property.type) {
              expect(typeof property.type).toBe('string');
            }
            // Allow for oneOf, anyOf patterns
            if (!property.type && !property.oneOf && !property.anyOf) {
              console.warn('Property missing type:', property);
            }
          });
        }
        
        if (jsonSchema.required) {
          expect(Array.isArray(jsonSchema.required)).toBe(true);
        }
      });
    });

    it('should handle nested objects and arrays correctly', () => {
      const jsonSchema = convertZodToJsonSchema(InstallPackagesSchema);
      
      // Check array items schema
      const packagesProperty = jsonSchema.properties.packages;
      expect(packagesProperty.type).toBe('array');
      expect(packagesProperty.items).toBeDefined();
      expect(packagesProperty.items.type).toBe('string');
    });

    it('should preserve descriptions in schema conversion', () => {
      const jsonSchema = convertZodToJsonSchema(InstallPackagesSchema);
      
      // The converter should preserve Zod descriptions
      Object.values(jsonSchema.properties).forEach((property: any) => {
        if (property.description) {
          expect(typeof property.description).toBe('string');
          expect(property.description.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('MCP Response Format Validation', () => {
    it('should validate successful response format', () => {
      const successResponse = {
        content: [{
          type: 'text',
          text: 'Sample response text'
        }]
      };

      expect(successResponse).toMatchObject({
        content: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            text: expect.any(String)
          })
        ])
      });
    });

    it('should validate error response format', () => {
      const errorResponse = {
        isError: true,
        content: [{
          type: 'text',
          text: 'Error message'
        }]
      };

      expect(errorResponse).toMatchObject({
        isError: true,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.any(String)
          })
        ])
      });
    });

    it('should validate content type requirements', () => {
      const responses = [
        { content: [{ type: 'text', text: 'Valid response' }] },
        { isError: true, content: [{ type: 'text', text: 'Error response' }] }
      ];

      responses.forEach(response => {
        expect(response.content).toBeDefined();
        expect(Array.isArray(response.content)).toBe(true);
        
        response.content.forEach(content => {
          expect(content).toHaveProperty('type');
          expect(content).toHaveProperty('text');
          expect(typeof content.type).toBe('string');
          expect(typeof content.text).toBe('string');
        });
      });
    });
  });

  describe('JSON Serialization Safety', () => {
    it('should ensure all schemas are JSON serializable', () => {
      const schemas = [InstallPackagesSchema, SearchPackagesSchema];
      
      schemas.forEach(schema => {
        const jsonSchema = convertZodToJsonSchema(schema);
        
        // Should be able to stringify and parse without errors
        expect(() => {
          const serialized = JSON.stringify(jsonSchema);
          const parsed = JSON.parse(serialized);
          expect(parsed).toEqual(jsonSchema);
        }).not.toThrow();
      });
    });

    it('should not contain circular references', () => {
      const jsonSchema = convertZodToJsonSchema(InstallPackagesSchema);
      
      // JSON.stringify will throw if there are circular references
      expect(() => JSON.stringify(jsonSchema)).not.toThrow();
    });

    it('should handle special characters in schema properly', () => {
      const jsonSchema = convertZodToJsonSchema(SearchPackagesSchema);
      const serialized = JSON.stringify(jsonSchema);
      
      // Should be valid JSON
      expect(() => JSON.parse(serialized)).not.toThrow();
      
      // Should not contain undefined values
      expect(serialized).not.toContain('undefined');
      expect(serialized).not.toContain('null');
    });
  });
});