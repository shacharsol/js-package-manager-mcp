# Deployment Test Scripts

## test-deployment.sh

Comprehensive test script that validates NPM Plus deployment across all endpoints.

### What it tests:

- ✅ **Health endpoint** - Basic service health check
- ✅ **MCP endpoint** - Model Context Protocol initialization
- ✅ **Analytics dashboard** - Dashboard loads correctly
- ✅ **Analytics data API** - JSON data endpoint works
- ✅ **Main website** - Static site accessibility
- ✅ **CORS headers** - Cross-origin request support
- ✅ **API redirects** - URL rewriting functionality

### Usage:

```bash
# Run tests manually
./scripts/test-deployment.sh

# Run via npm script
npm run test:deployment
```

### When to run:

- After every deployment to Netlify
- Before pushing releases
- When debugging endpoint issues
- As part of CI/CD pipeline

### Exit codes:

- `0` - All tests passed
- `1` - One or more tests failed

### Sample output:

```
🚀 Testing NPM Plus deployment...
🔍 Running endpoint tests...

Testing Health... ✅ PASS (200) - Health check endpoint
Testing MCP endpoint... ✅ PASS - MCP initialization works
...

🎉 All tests passed! Deployment is successful.
```