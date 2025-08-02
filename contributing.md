# Contributing to MCP Package Manager

Thank you for your interest in contributing to the MCP Package Manager! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node version, package manager)

### Suggesting Features

1. Check existing feature requests
2. Open a discussion with:
   - Use case description
   - Proposed implementation approach
   - Alternative solutions considered

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit with descriptive messages
7. Push to your fork
8. Open a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/mcp-package-manager.git
cd mcp-package-manager

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server setup
├── tools/             # Tool implementations
│   ├── search.ts      # Package search
│   ├── install.ts     # Install/update/remove
│   ├── security.ts    # Vulnerability scanning
│   ├── analysis.ts    # Bundle size & dependencies
│   └── management.ts  # Utilities
├── utils/             # Shared utilities
│   ├── cache.ts       # Caching layer
│   ├── pm-detect.ts   # Package manager detection
│   └── http-client.ts # HTTP requests
└── __tests__/         # Test files
```

## Adding a New Tool

1. Create the tool handler in the appropriate file under `src/tools/`
2. Define the input schema using Zod
3. Implement the handler function
4. Add the tool to the exports
5. Add tests for the new tool
6. Update documentation

Example:

```typescript
// Define schema
const MyToolSchema = z.object({
  param: z.string().describe("Parameter description")
});

// Implement handler
async function handleMyTool(args: unknown) {
  const input = MyToolSchema.parse(args);
  // Implementation
  return {
    content: [{
      type: "text",
      text: "Result"
    }]
  };
}

// Export
export const tools = [
  {
    name: "my_tool",
    description: "Tool description",
    inputSchema: MyToolSchema
  }
];

export const handlers = new Map([
  ["my_tool", handleMyTool]
]);
```

## Testing Guidelines

- Write unit tests for new functionality
- Test error cases and edge conditions
- Mock external API calls
- Ensure tests are deterministic
- Use descriptive test names

Example test:

```typescript
describe("MyTool", () => {
  it("should handle valid input correctly", async () => {
    const result = await handleMyTool({ param: "test" });
    expect(result.content[0].text).toContain("expected output");
  });

  it("should validate input schema", async () => {
    await expect(handleMyTool({ invalid: true }))
      .rejects.toThrow();
  });
});
```

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Keep functions focused and small
- Use descriptive variable names
- Add comments for complex logic
- Handle errors gracefully

## API Integration Guidelines

When integrating with external APIs:

1. Use the shared HTTP client
2. Implement proper error handling
3. Add caching where appropriate
4. Respect rate limits
5. Document API limitations

## Documentation

- Update README.md for new features
- Add JSDoc comments for functions
- Include examples in documentation
- Keep tool descriptions clear and concise

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a pull request
4. After merge, tag the release
5. Publish to npm (maintainers only)

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Reach out to maintainers

Thank you for contributing!