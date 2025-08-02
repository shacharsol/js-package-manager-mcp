#!/bin/bash

# Deployment Setup Script
# This script sets up deployment files locally without modifying the main package.json

set -e

echo "🚀 Setting up deployment configuration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Create deployment files if they don't exist
if [ ! -f "netlify.toml" ]; then
    echo "📄 Creating netlify.toml..."
    cp deployment/netlify.toml.example netlify.toml
    echo "✅ Created netlify.toml"
else
    echo "📄 netlify.toml already exists"
fi

if [ ! -d "netlify/functions" ]; then
    echo "📁 Creating netlify/functions directory..."
    mkdir -p netlify/functions
    cp deployment/netlify-functions/* netlify/functions/
    echo "✅ Created netlify functions"
else
    echo "📁 netlify/functions already exists"
fi

if [ ! -d "scripts" ]; then
    mkdir -p scripts
fi

if [ ! -f "scripts/test-deployment.sh" ]; then
    echo "📄 Creating test-deployment.sh..."
    cp deployment/test-deployment.sh.example scripts/test-deployment.sh
    chmod +x scripts/test-deployment.sh
    echo "✅ Created test-deployment.sh"
else
    echo "📄 scripts/test-deployment.sh already exists"
fi

# Create local package extension if it doesn't exist
if [ ! -f "package.user.json" ]; then
    echo "📄 Creating package.user.json..."
    cp deployment/package.user.json.example package.user.json
    echo "✅ Created package.user.json"
else
    echo "📄 package.user.json already exists"
fi

echo ""
echo "🎉 Deployment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit scripts/test-deployment.sh to use your domain URLs"
echo "2. Customize netlify.toml if needed"
echo "3. Install deployment dependencies: npm install --save-dev netlify-cli"
echo "4. Use these commands for deployment:"
echo "   - npm run deploy:netlify (deploy to production)"
echo "   - npm run deploy:dev (deploy to dev alias)"
echo "   - npm run test:deployment (test deployed endpoints)"
echo ""
echo "💡 Note: All deployment files are gitignored and won't be committed"