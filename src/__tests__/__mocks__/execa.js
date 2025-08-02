// Mock implementation of execa for testing
const mockExeca = jest.fn();

mockExeca.mockResolvedValue({
  stdout: '',
  stderr: '',
  exitCode: 0,
  failed: false,
  killed: false,
  signal: null,
  command: 'mock command',
  escapedCommand: 'mock command'
});

module.exports = {
  execa: mockExeca
};