/**
 * Jest test setup file
 */

// Mock console methods to reduce noise in tests
const originalConsole = global.console;

beforeAll(() => {
  global.console = {
    ...originalConsole,
    // Suppress console.log, console.warn, console.info in tests
    log: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    // Keep console.error for debugging
    error: originalConsole.error,
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Global test timeout
jest.setTimeout(30000);

// Mock process.cwd() for consistent test environment
const originalCwd = process.cwd;
beforeEach(() => {
  process.cwd = jest.fn().mockReturnValue('/tmp/test-project');
});

afterEach(() => {
  process.cwd = originalCwd;
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global constants for tests
export const TEST_CONSTANTS = {
  TIMEOUT: 5000,
  CACHE_TTL: 100,
  TEST_PACKAGE: 'lodash',
  TEST_PACKAGE_VERSION: '4.17.21',
  TEST_SEARCH_QUERY: 'react testing',
  MOCK_CWD: '/tmp/test-project',
};