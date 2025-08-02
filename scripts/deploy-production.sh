#!/bin/bash

# Production Deployment Script
# Only the maintainer should run this script

echo "🔒 NPM Plus Production Deployment"
echo "=================================="
echo ""

# Check if user should be deploying
read -p "⚠️  Are you the maintainer of npmplus.dev? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ This script is only for the maintainer of npmplus.dev"
    echo ""
    echo "📚 For your own deployment, see: deployment/README.md"
    echo "🌐 To use the hosted service: https://api.npmplus.dev/mcp"
    exit 1
fi

echo ""
echo "🔍 Checking prerequisites..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Install with: npm install -g netlify-cli"
    exit 1
fi

# Check if logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "❌ Not logged in to Netlify. Run: netlify login"
    exit 1
fi

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    echo "❌ Not logged in to npm. Run: npm login"
    exit 1
fi

# Check if in correct directory
if [[ ! -f "netlify.toml" ]]; then
    echo "❌ Run this script from the project root directory"
    exit 1
fi

# Check if git working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Git working directory is not clean. Commit or stash changes first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Version bumping
echo "📦 Version Management"
echo "===================="
echo ""

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: v${CURRENT_VERSION}"
echo ""

echo "Choose version bump type:"
echo "1) patch (x.x.X) - Bug fixes and small improvements"
echo "2) minor (x.X.x) - New features and enhancements"
echo "3) major (X.x.x) - Breaking changes"
echo "4) Skip version bump (use current version)"
echo ""

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        BUMP_TYPE="patch"
        ;;
    2)
        BUMP_TYPE="minor"
        ;;
    3)
        BUMP_TYPE="major"
        ;;
    4)
        echo "📌 Using current version v${CURRENT_VERSION}"
        NEW_VERSION=$CURRENT_VERSION
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

if [[ -n $BUMP_TYPE ]]; then
    echo ""
    echo "🔄 Bumping version (${BUMP_TYPE})..."
    
    # Use npm version command directly
    npm version $BUMP_TYPE --no-git-tag-version > /dev/null 2>&1
    
    if [[ $? -ne 0 ]]; then
        echo "❌ Version bump failed"
        exit 1
    fi
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "✅ Version bumped to v${NEW_VERSION}"
    
    # Update constants.ts
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/export const VERSION = '[^']*';/export const VERSION = '${NEW_VERSION}';/" src/constants.ts
        sed -i '' "s/version: \"[^\"]*\"/version: \"${NEW_VERSION}\"/g" netlify/functions/npmplus-mcp.cjs
    else
        sed -i "s/export const VERSION = '[^']*';/export const VERSION = '${NEW_VERSION}';/" src/constants.ts
        sed -i "s/version: \"[^\"]*\"/version: \"${NEW_VERSION}\"/g" netlify/functions/npmplus-mcp.cjs
    fi
    
    # Update test that checks version
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/expect(VERSION).toBe('[^']*');/expect(VERSION).toBe('${NEW_VERSION}');/" src/__tests__/constants.test.ts
    else
        sed -i "s/expect(VERSION).toBe('[^']*');/expect(VERSION).toBe('${NEW_VERSION}');/" src/__tests__/constants.test.ts
    fi
    
    # Commit version bump
    echo "📝 Committing version bump..."
    git add .
    git commit -m "bump: version v${NEW_VERSION}" > /dev/null 2>&1
    git tag "v${NEW_VERSION}" > /dev/null 2>&1
    echo "✅ Version committed and tagged"
fi

echo ""

# Build the project
echo "🏗️  Building project..."
npm run build

if [[ $? -ne 0 ]]; then
    echo "❌ Build failed. Fix errors before deploying."
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test

if [[ $? -ne 0 ]]; then
    echo "❌ Tests failed. Fix tests before deploying."
    exit 1
fi

echo "✅ All tests passed"
echo ""

# NPM Publishing
echo "📦 NPM Publishing"
echo "================="
echo ""

# Check if this version is already published
PUBLISHED_VERSION=$(npm view npmplus-mcp-server version 2>/dev/null || echo "none")
CURRENT_VERSION=$(node -p "require('./package.json').version")

if [[ "$PUBLISHED_VERSION" == "$CURRENT_VERSION" ]]; then
    echo "⚠️  Version v${CURRENT_VERSION} is already published to npm"
    echo "🔄 Consider bumping the version or use --force to republish"
    echo ""
    read -p "   Skip npm publish? (Y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "❌ Publishing cancelled. Bump version first."
        exit 1
    else
        echo "📌 Skipping npm publish"
        SKIP_PUBLISH=true
    fi
else
    echo "📤 Publishing v${CURRENT_VERSION} to npm..."
    
    # Show what will be published
    echo "📋 Package contents:"
    npm pack --dry-run | head -20
    echo ""
    
    read -p "   Continue with npm publish? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ NPM publish cancelled"
        exit 1
    fi
    
    # Publish to npm
    npm publish
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Successfully published v${CURRENT_VERSION} to npm"
        echo "🌐 Package available at: https://www.npmjs.com/package/npmplus-mcp-server"
    else
        echo "❌ NPM publish failed!"
        exit 1
    fi
fi

echo ""

# Git push
if [[ -n $BUMP_TYPE ]]; then
    echo "🚀 Pushing to git..."
    git push origin production --tags > /dev/null 2>&1
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Pushed to git with tags"
    else
        echo "❌ Git push failed!"
        exit 1
    fi
    echo ""
fi

# Confirm deployment
echo "🌐 Netlify Deployment"
echo "===================="
echo ""
echo "🚀 Ready to deploy v${CURRENT_VERSION} to production (api.npmplus.dev)"
read -p "   Continue with deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy to production (skip build since netlify.toml blocks it)
echo "🌐 Deploying to production..."
netlify deploy --prod --dir=dist

if [[ $? -eq 0 ]]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "🌐 Service available at: https://api.npmplus.dev"
    echo ""
    echo "🧪 Testing endpoints..."
    
    # Test health endpoint
    echo -n "Health check: "
    if curl -s -f https://api.npmplus.dev/health > /dev/null; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    
    # Test MCP endpoint with GET request (for service discovery)
    echo -n "MCP GET endpoint: "
    if curl -s -f https://api.npmplus.dev/mcp > /dev/null; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    
    # Test MCP endpoint with proper POST request
    echo -n "MCP POST endpoint: "
    response=$(curl -s -X POST https://api.npmplus.dev/mcp \
        -H "Content-Type: application/json" \
        -d '{"method":"initialize","params":{}}')
    
    if echo "$response" | grep -q "protocolVersion"; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
        echo "Response: $response"
    fi
    
    echo ""
    echo "📋 Deployment Summary"
    echo "===================="
    
    if [[ -n $BUMP_TYPE ]]; then
        echo "📦 Version: v${NEW_VERSION} (${BUMP_TYPE} bump)"
        echo "🏷️  Git Tag: v${NEW_VERSION}"
    else
        echo "📦 Version: v${CURRENT_VERSION}"
    fi
    
    if [[ "$SKIP_PUBLISH" != "true" ]]; then
        echo "📤 NPM: https://www.npmjs.com/package/npmplus-mcp-server"
    fi
    
    echo "🌐 API: https://api.npmplus.dev"
    echo "📊 Monitor: https://app.netlify.com/projects/js-package-manager-mcp"
    echo "📚 Docs: https://npmplus.dev"
    
    echo ""
    echo "✨ Ready for use in:"
    echo "   • Claude Desktop (NPX)"
    echo "   • Windsurf (NPX or HTTP)"
    echo "   • Cursor (NPX only - HTTP not supported)"
    echo "   • VS Code + Cline (NPX)"
    echo "   • Any MCP-compatible editor"
else
    echo "❌ Deployment failed!"
    exit 1
fi