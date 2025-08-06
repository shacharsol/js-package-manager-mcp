# Testing Guide for npmplus MCP Server

## Overview

This document describes the testing strategy and procedures for the npmplus MCP server. We have multiple levels of testing to ensure reliability and production readiness.

## Test Types

### 1. Unit Tests
Standard Jest unit tests for individual components.

```bash
npm test
```

### 2. Quick Production Test
Fast smoke test to verify production deployment (< 5 seconds).

```bash
npm run test:production
```

This test verifies:
- ✅ Production endpoint accessibility
- ✅ Health check endpoint
- ✅ Local server functionality
- ✅ Tool loading and basic operation
- ✅ npm registry version match

### 3. Full Deployment Validation
Comprehensive test suite for all features (~2 minutes).

```bash
npm run test:deployment
```

This test validates:
- All 15 major features
- Error handling
- Performance benchmarks
- Security operations
- Package management operations

## Production Testing Checklist

### Before Deployment

1. **Run Local Tests**
   ```bash
   npm test
   npm run build
   ```

2. **Version Bump**
   ```bash
   npm run bump
   ```

### After Deployment

1. **Quick Verification** (30 seconds)
   ```bash
   npm run test:production
   ```
   
   Expected output:
   ```
   ✅ PRODUCTION DEPLOYMENT VERIFIED
   ```

2. **Full Validation** (Optional, 2-3 minutes)
   ```bash
   npm run test:deployment
   ```

## Test Results Reference

### Current Status (v12.0.4)
- **Working Features**: 14/15
- **Known Issues**: 
  - Vulnerability check API (intermittent failures)
  - Directory resolution with relative paths (use absolute paths)

### Feature Status Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Search Packages | ✅ | Global operation |
| Package Info | ✅ | Global operation |
| Bundle Size Check | ✅ | Global operation |
| Download Stats | ✅ | Global operation |
| License Check | ✅ | Global operation |
| Install Packages | ✅ | Requires full path |
| Update Packages | ✅ | Requires full path |
| Remove Packages | ✅ | Requires full path |
| Dependency Tree | ✅ | Requires full path |
| List Licenses | ✅ | Requires full path |
| Audit Dependencies | ✅ | Requires full path |
| Analyze Dependencies | ✅ | Requires full path |
| Check Outdated | ✅ | Works with "." or full path |
| Clean Cache | ✅ | Works with "." or full path |
| Check Vulnerability | ⚠️ | API intermittent issues |

## Performance Benchmarks

Expected response times:
- Search operations: < 1 second
- Package info: < 1 second
- Bundle size check: < 2 seconds
- npm operations: 1-7 seconds (varies by package size)
- Cache operations: < 1 second

## Troubleshooting

### Common Issues

1. **"npm error Tracker 'idealTree' already exists"**
   - Solution: Clear npm cache
   ```bash
   npm cache clean --force
   ```

2. **"Invalid project directory: /"**
   - Solution: Use absolute paths instead of "."
   ```javascript
   // ❌ Wrong
   { cwd: "." }
   
   // ✅ Correct
   { cwd: "/full/path/to/project" }
   ```

3. **Vulnerability check fails with "fetch failed"**
   - This is a known issue with the external API
   - The feature may work intermittently

### Debug Mode

For detailed test output:
```bash
npm test -- --verbose
```

For specific test file:
```bash
npm test -- src/__tests__/deployment-validation.test.ts
```

## CI/CD Integration

### GitHub Actions
Add to `.github/workflows/deploy.yml`:

```yaml
- name: Test Production Deployment
  run: npm run test:production
```

### Netlify Post-Deploy
The quick test can be run as a post-deploy check:

```bash
curl -X POST https://api.npmplus.dev/test
```

## Manual Testing

### Using Claude Desktop

1. Configure MCP server in Claude Desktop
2. Test each tool manually:

```
Search for "react hooks"
Get info for "axios"
Check bundle size of "lodash"
```

### Using curl

Test the production endpoint:
```bash
curl -X POST https://api.npmplus.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Test Development

### Adding New Tests

1. Add test to `src/__tests__/deployment-validation.test.ts`
2. Update quick test if needed: `scripts/quick-test-production.js`
3. Document in this file

### Test Data

Use these packages for consistent testing:
- Popular: `lodash`
- Small: `is-odd`
- With vulnerabilities: `express@4.17.0`
- For bundle size: `dayjs`
- For stats: `react`

## Monitoring

### Production Metrics
Monitor these metrics post-deployment:
- HTTP status codes (should be 200 for Netlify functions)
- Response times (< 2 seconds for most operations)
- Error rates (< 1%)
- npm registry sync status

### Alerts
Set up alerts for:
- Endpoint downtime
- Response time > 5 seconds
- Error rate > 5%
- Version mismatch between npm and production

## Contact

For issues or questions:
- GitHub Issues: https://github.com/shacharsol/js-package-manager-mcp/issues
- Email: shachar@npmplus.dev