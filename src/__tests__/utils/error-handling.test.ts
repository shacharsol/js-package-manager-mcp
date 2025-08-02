import { describe, it, expect, jest } from '@jest/globals';
import {
  PackageManagerError,
  withErrorHandling,
  extractErrorMessage,
  getErrorSuggestion,
  formatError,
  safeExecute
} from '../../utils/error-handling.js';

describe('error-handling utilities', () => {
  describe('PackageManagerError', () => {
    it('should create error with all properties', () => {
      const originalError = new Error('Original message');
      const context = { package: 'express', cwd: '/tmp' };
      
      const error = new PackageManagerError(
        'Failed to install',
        'install',
        context,
        originalError
      );

      expect(error.message).toBe('Failed to install');
      expect(error.operation).toBe('install');
      expect(error.context).toEqual(context);
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('PackageManagerError');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const operation = async () => 'success';
      const context = { operation: 'test', package: 'test-pkg' };

      const result = await withErrorHandling(operation, context);
      expect(result).toBe('success');
    });

    it('should throw PackageManagerError on failure', async () => {
      const operation = async () => {
        throw new Error('Original error');
      };
      const context = { operation: 'test', package: 'test-pkg' };

      await expect(withErrorHandling(operation, context)).rejects.toThrow(
        PackageManagerError
      );

      try {
        await withErrorHandling(operation, context);
      } catch (error) {
        expect(error).toBeInstanceOf(PackageManagerError);
        if (error instanceof PackageManagerError) {
          expect(error.message).toContain('Failed to test');
          expect(error.operation).toBe('test');
          expect(error.context).toEqual(context);
        }
      }
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from PackageManagerError', () => {
      const error = new PackageManagerError('PM error', 'install');
      expect(extractErrorMessage(error)).toBe('PM error');
    });

    it('should handle specific npm error patterns', () => {
      expect(extractErrorMessage(new Error('ENOTFOUND registry.npmjs.org')))
        .toBe('Network error: Unable to connect to npm registry');
      
      expect(extractErrorMessage(new Error('EACCES permission denied')))
        .toBe('Permission denied: Try running with sudo or check file permissions');
      
      expect(extractErrorMessage(new Error('ENOENT no such file')))
        .toBe('File or directory not found');
      
      expect(extractErrorMessage(new Error('Invalid package name')))
        .toBe('Invalid package name format');
    });

    it('should handle regular errors', () => {
      expect(extractErrorMessage(new Error('Regular error')))
        .toBe('Regular error');
    });

    it('should handle non-error objects', () => {
      expect(extractErrorMessage('string error')).toBe('string error');
      expect(extractErrorMessage(null)).toBe('null');
      expect(extractErrorMessage(undefined)).toBe('undefined');
    });
  });

  describe('getErrorSuggestion', () => {
    it('should provide suggestions for known error patterns', () => {
      expect(getErrorSuggestion(new Error('ENOTFOUND')))
        .toBe('Check your internet connection and npm registry configuration');
      
      expect(getErrorSuggestion(new Error('EACCES')))
        .toBe('Try running the command with appropriate permissions or use a package manager like nvm');
      
      expect(getErrorSuggestion(new Error('Invalid package name')))
        .toBe('Ensure package name follows npm naming conventions (lowercase, no spaces)');
      
      expect(getErrorSuggestion(new Error('404 not found')))
        .toBe('Verify the package name is correct and exists in the npm registry');
      
      expect(getErrorSuggestion(new Error('version not found')))
        .toBe('Check if the specified version exists and use valid semver format');
    });

    it('should return null for unknown errors', () => {
      expect(getErrorSuggestion(new Error('Unknown error'))).toBeNull();
    });
  });

  describe('formatError', () => {
    it('should format error with context and suggestions', () => {
      const error = new Error('ENOTFOUND registry.npmjs.org');
      const context = {
        package: 'express',
        cwd: '/tmp',
        command: 'npm install'
      };

      const formatted = formatError(error, context);
      
      expect(formatted).toContain('Network error: Unable to connect to npm registry');
      expect(formatted).toContain('Package: express');
      expect(formatted).toContain('Directory: /tmp');
      expect(formatted).toContain('Command: npm install');
      expect(formatted).toContain('💡 Suggestion: Check your internet connection');
    });

    it('should format error without context', () => {
      const error = new Error('Simple error');
      const formatted = formatError(error);
      
      expect(formatted).toBe('Simple error');
    });

    it('should format error without suggestion', () => {
      const error = new Error('Unknown error');
      const context = { package: 'test' };
      
      const formatted = formatError(error, context);
      
      expect(formatted).toContain('Unknown error');
      expect(formatted).toContain('Package: test');
      expect(formatted).not.toContain('💡 Suggestion');
    });
  });

  describe('safeExecute', () => {
    it('should return result on success', async () => {
      const operation = async () => 'success';
      const result = await safeExecute(operation, 'fallback');
      
      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const operation = async () => {
        throw new Error('Failed');
      };
      const result = await safeExecute(operation, 'fallback');
      
      expect(result).toBe('fallback');
    });

    it('should call onError callback', async () => {
      const operation = async () => {
        throw new Error('Failed');
      };
      
      const onError = jest.fn();
      await safeExecute(operation, 'fallback', onError);
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});