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

# Check if in correct directory
if [[ ! -f "netlify.toml" ]]; then
    echo "❌ Run this script from the project root directory"
    exit 1
fi

echo "✅ Prerequisites check passed"
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

# Confirm deployment
echo "🚀 Ready to deploy to production (api.npmplus.dev)"
read -p "   Continue with deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy to production
echo "🌐 Deploying to production..."
netlify deploy --prod

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
    
    # Test MCP endpoint
    echo -n "MCP endpoint: "
    if curl -s -f https://api.npmplus.dev/mcp > /dev/null; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
    
    echo ""
    echo "📊 Monitor: https://app.netlify.com/projects/js-package-manager-mcp"
else
    echo "❌ Deployment failed!"
    exit 1
fi