/**
 * Common error handling utilities
 */

export interface ErrorContext {
  operation: string;
  package?: string;
  cwd?: string;
  command?: string;
}

/**
 * Enhanced error class with context information
 */
export class PackageManagerError extends Error {
  public readonly operation: string;
  public readonly context?: Partial<ErrorContext>;
  public readonly originalError?: Error;

  constructor(
    message: string, 
    operation: string, 
    context?: Partial<ErrorContext>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'PackageManagerError';
    this.operation = operation;
    this.context = context;
    this.originalError = originalError;
  }
}

/**
 * Wraps async operations with consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new PackageManagerError(
      `Failed to ${context.operation}: ${errorMessage}`,
      context.operation,
      context,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Extracts meaningful error messages from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof PackageManagerError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Handle specific npm/yarn error patterns
    if (error.message.includes('ENOTFOUND')) {
      return 'Network error: Unable to connect to npm registry';
    }
    
    if (error.message.includes('EACCES')) {
      return 'Permission denied: Try running with sudo or check file permissions';
    }
    
    if (error.message.includes('ENOENT')) {
      return 'File or directory not found';
    }
    
    if (error.message.includes('Invalid package name')) {
      return 'Invalid package name format';
    }
    
    return error.message;
  }
  
  return String(error);
}

/**
 * Determines if an error is recoverable and suggests fixes
 */
export function getErrorSuggestion(error: unknown): string | null {
  // Check original error message first before extractErrorMessage transforms it
  const originalMessage = error instanceof Error ? error.message : String(error);
  const extractedMessage = extractErrorMessage(error);
  
  if (originalMessage.includes('ENOTFOUND') || extractedMessage.includes('Unable to connect to npm registry')) {
    return 'Check your internet connection and npm registry configuration';
  }
  
  if (originalMessage.includes('EACCES') || extractedMessage.includes('Permission denied')) {
    return 'Try running the command with appropriate permissions or use a package manager like nvm';
  }
  
  if (originalMessage.includes('Invalid package name') || extractedMessage.includes('Invalid package name')) {
    return 'Ensure package name follows npm naming conventions (lowercase, no spaces)';
  }
  
  // Check for version-specific errors first (more specific)
  if (extractedMessage.includes('version')) {
    return 'Check if the specified version exists and use valid semver format';
  }
  
  // Check for general not found errors after version checks
  if (extractedMessage.includes('404') || extractedMessage.includes('not found')) {
    return 'Verify the package name is correct and exists in the npm registry';
  }
  
  return null;
}

/**
 * Formats error with context and suggestions
 */
export function formatError(error: unknown, context?: Partial<ErrorContext>): string {
  const message = extractErrorMessage(error);
  const suggestion = getErrorSuggestion(error);
  
  let output = message;
  
  if (context) {
    const contextParts: string[] = [];
    if (context.package) contextParts.push(`Package: ${context.package}`);
    if (context.cwd) contextParts.push(`Directory: ${context.cwd}`);
    if (context.command) contextParts.push(`Command: ${context.command}`);
    
    if (contextParts.length > 0) {
      output += `\n\nContext:\n${contextParts.join('\n')}`;
    }
  }
  
  if (suggestion) {
    output += `\n\n💡 Suggestion: ${suggestion}`;
  }
  
  return output;
}

/**
 * Safely execute a function with error recovery
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: unknown) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    onError?.(error);
    return fallback;
  }
}