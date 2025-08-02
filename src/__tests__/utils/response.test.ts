import { describe, it, expect } from '@jest/globals';
import {
  createSuccessResponse,
  createErrorResponse,
  createInfoResponse,
  createWarningResponse
} from '../../utils/response.js';

describe('response utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create a success response with text content', () => {
      const response = createSuccessResponse('Operation completed successfully');
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: 'Operation completed successfully'
          }
        ]
      });
      expect(response.isError).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from Error object', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ Something went wrong'
          }
        ],
        isError: true
      });
    });

    it('should create error response from string', () => {
      const response = createErrorResponse('String error message');
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ String error message'
          }
        ],
        isError: true
      });
    });

    it('should create error response with context', () => {
      const error = new Error('Connection failed');
      const response = createErrorResponse(error, 'Failed to fetch data');
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ Failed to fetch data: Connection failed'
          }
        ],
        isError: true
      });
    });

    it('should create error response with string error and context', () => {
      const response = createErrorResponse('Network timeout', 'API request failed');
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ API request failed: Network timeout'
          }
        ],
        isError: true
      });
    });
  });

  describe('createInfoResponse', () => {
    it('should create info response with title and content', () => {
      const response = createInfoResponse('Package Information', 'express v4.18.2');
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: 'ℹ️ Package Information\n\nexpress v4.18.2'
          }
        ]
      });
      expect(response.isError).toBeUndefined();
    });
  });

  describe('createWarningResponse', () => {
    it('should create warning response', () => {
      const response = createWarningResponse('This package has security vulnerabilities');
      
      expect(response).toEqual({
        content: [
          {
            type: 'text',
            text: '⚠️ This package has security vulnerabilities'
          }
        ]
      });
      expect(response.isError).toBeUndefined();
    });
  });
});