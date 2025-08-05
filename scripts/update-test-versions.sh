#!/bin/bash

# Update test version expectations to match package.json version

VERSION=$(node -p "require('./package.json').version")

echo "Updating test version expectations to $VERSION..."

# Update MCP production integration tests
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/expect(response\.result\.serverInfo\.version)\.toBe('[^']*');/expect(response.result.serverInfo.version).toBe('${VERSION}');/g" src/__tests__/mcp-production-integration.test.ts
    sed -i '' "s/expect(response\.version)\.toBe('[^']*');/expect(response.version).toBe('${VERSION}');/g" src/__tests__/mcp-production-integration.test.ts
    sed -i '' "s/expect(VERSION)\.toBe('[^']*');/expect(VERSION).toBe('${VERSION}');/g" src/__tests__/constants.test.ts
else
    sed -i "s/expect(response\.result\.serverInfo\.version)\.toBe('[^']*');/expect(response.result.serverInfo.version).toBe('${VERSION}');/g" src/__tests__/mcp-production-integration.test.ts
    sed -i "s/expect(response\.version)\.toBe('[^']*');/expect(response.version).toBe('${VERSION}');/g" src/__tests__/mcp-production-integration.test.ts
    sed -i "s/expect(VERSION)\.toBe('[^']*');/expect(VERSION).toBe('${VERSION}');/g" src/__tests__/constants.test.ts
fi

echo "✅ Test version expectations updated to $VERSION"