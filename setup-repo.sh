#!/bin/bash

echo "🚀 Setting up JavaScript Package Manager MCP repository..."

# Repository URL
REPO_URL="https://github.com/finsavvyai/js-package-manager-mcp.git"

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi

echo "✅ Build successful!"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git branch -M main
fi

# Add remote if not exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding remote origin..."
    git remote add origin $REPO_URL
else
    echo "🔗 Remote origin already exists"
fi

echo "📋 Adding files to git..."
git add .

echo "💾 Committing changes..."
git commit -m "feat: JavaScript Package Manager MCP Server

- Complete MCP server for NPM/Yarn/pnpm package management
- Netlify hosting support with serverless functions
- Multi-editor configuration (Windsurf, VS Code, Cursor)
- Security tools, bundle analysis, and dependency management
- One-click deployment to Netlify

🚀 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Repository setup complete!"
    echo ""
    echo "🌐 GitHub Repository: $REPO_URL"
    echo "🚀 Deploy to Netlify: https://app.netlify.com/start/deploy?repository=$REPO_URL"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to Netlify and connect your repository"
    echo "2. Set build command: npm run build:netlify"
    echo "3. Set publish directory: dist"
    echo "4. Deploy and get your MCP server URL!"
    echo ""
    echo "🔗 Your hosted MCP server will be available at:"
    echo "   https://js-package-manager-mcp.netlify.app/.netlify/functions/mcp"
else
    echo "❌ Failed to push to repository. Please check your GitHub access."
fi