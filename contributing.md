# Contributing to NPM Plus

Thank you for your interest in contributing to NPM Plus! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm, yarn, or pnpm
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/js-package-manager-mcp.git
   cd js-package-manager-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   npm run test:deployment
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🛠️ Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add bundle size analysis tool
fix: handle edge case in dependency tree parsing
docs: update editor setup instructions
test: add security audit tool tests
```

### Code Style

- **TypeScript**: Use strict type checking
- **ESLint**: Follow configured linting rules
- **Prettier**: Auto-format on save
- **Comments**: Document complex logic and public APIs

### Testing

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test tool interactions
- **Deployment tests**: Validate production endpoints

```bash
# Run all tests
npm test

# Test specific file
npm test -- search-tool.test.ts

# Test deployment
npm run test:deployment
```

## 📝 Contributing Guidelines

### Adding New Tools

1. **Create tool implementation** in `src/tools/`
2. **Add Zod schema** for input validation
3. **Write comprehensive tests**
4. **Update tool registry** in main server file
5. **Document in README**

**Example:**
```typescript
// src/tools/my-tool.ts
import { z } from 'zod';

export const MyToolSchema = z.object({
  packageName: z.string().min(1),
  version: z.string().optional(),
});

export async function myTool(args: z.infer<typeof MyToolSchema>) {
  // Implementation
}
```

### Security Considerations

- **Input validation**: Always use Zod schemas
- **Subprocess execution**: Use `execa` for safe command execution
- **No credentials**: Never store or log sensitive information
- **Error handling**: Provide safe error messages

### Performance Guidelines

- **Caching**: Use appropriate cache TTLs
- **Rate limiting**: Respect API rate limits
- **Batching**: Optimize for multiple operations
- **Memory**: Monitor memory usage in long-running operations

## 🎯 Areas for Contribution

### High Priority

- **Package manager support**: Add support for additional package managers
- **Performance optimization**: Improve caching and parallel processing
- **Error handling**: Enhanced error messages and recovery
- **Documentation**: Tutorial videos and guides

### Medium Priority

- **Testing**: Increase test coverage
- **Monitoring**: Add more analytics and metrics
- **UI/UX**: Improve analytics dashboard
- **Integrations**: Support for more AI editors

### Low Priority

- **Refactoring**: Code cleanup and modernization
- **Dependencies**: Update and optimize dependencies
- **Automation**: CI/CD improvements

## 🐛 Reporting Issues

### Bug Reports

Use the **Bug Report** template and include:

- **Environment**: OS, Node.js version, package manager
- **Steps to reproduce**: Clear reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Logs**: Relevant error messages or logs

### Feature Requests

Use the **Feature Request** template and include:

- **Problem description**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives**: What alternatives did you consider?
- **Use cases**: Who would benefit and how?

## 🔍 Code Review Process

### Review Checklist

- [ ] **Functionality**: Does it work as intended?
- [ ] **Tests**: Are tests comprehensive and passing?
- [ ] **Documentation**: Is it properly documented?
- [ ] **Performance**: Are there performance implications?
- [ ] **Security**: Are there security considerations?
- [ ] **Style**: Does it follow code style guidelines?

### Review Timeline

- **Initial review**: Within 48 hours
- **Feedback incorporation**: Ongoing collaboration
- **Final approval**: When all requirements are met

## 📚 Resources

### Documentation

- [MCP SDK Documentation](https://modelcontextprotocol.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

### Tools

- [GitHub Repository](https://github.com/shacharsol/js-package-manager-mcp)
- [Issue Tracker](https://github.com/shacharsol/js-package-manager-mcp/issues)
- [Discussions](https://github.com/shacharsol/js-package-manager-mcp/discussions)

## 🎉 Recognition

Contributors will be:

- **Listed** in the contributors section
- **Credited** in release notes for significant contributions
- **Invited** to join the maintainer team for exceptional contributions

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: [shacharsol@gmail.com](mailto:shacharsol@gmail.com) for private matters

## 📄 License

By contributing to NPM Plus, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making NPM Plus better! 🚀