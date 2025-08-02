#!/bin/bash

# NPM Plus Version Bump Script
# Synchronizes version across package.json and constants.ts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 NPM Plus Version Bump Script${NC}"
echo "================================="
echo

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check if constants.ts exists
if [[ ! -f "src/constants.ts" ]]; then
    echo -e "${RED}❌ Error: src/constants.ts not found.${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${YELLOW}v${CURRENT_VERSION}${NC}"

# Ask for bump type or specific version
echo
echo "Choose version bump type:"
echo "1) patch (x.x.X) - Bug fixes"
echo "2) minor (x.X.x) - New features"
echo "3) major (X.x.x) - Breaking changes"
echo "4) Custom version"
echo
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
        echo
        read -p "Enter new version (e.g., 1.2.3): " NEW_VERSION
        # Validate version format
        if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}❌ Error: Invalid version format. Use X.Y.Z format.${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Error: Invalid choice.${NC}"
        exit 1
        ;;
esac

# Bump version using npm
if [[ -n $BUMP_TYPE ]]; then
    echo -e "${YELLOW}🔄 Bumping version (${BUMP_TYPE})...${NC}"
    npm version $BUMP_TYPE --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
else
    echo -e "${YELLOW}🔄 Setting version to ${NEW_VERSION}...${NC}"
    npm version $NEW_VERSION --no-git-tag-version
fi

echo -e "${GREEN}✅ Updated package.json to v${NEW_VERSION}${NC}"

# Update constants.ts
echo -e "${YELLOW}🔄 Updating src/constants.ts...${NC}"

# Use sed to replace the version in constants.ts
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/export const VERSION = '[^']*';/export const VERSION = '${NEW_VERSION}';/" src/constants.ts
else
    # Linux
    sed -i "s/export const VERSION = '[^']*';/export const VERSION = '${NEW_VERSION}';/" src/constants.ts
fi

echo -e "${GREEN}✅ Updated src/constants.ts to v${NEW_VERSION}${NC}"

# Update the version in the Netlify function
echo -e "${YELLOW}🔄 Updating netlify/functions/npmplus-mcp.cjs...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/version: \"[^\"]*\"/version: \"${NEW_VERSION}\"/g" netlify/functions/npmplus-mcp.cjs
else
    # Linux
    sed -i "s/version: \"[^\"]*\"/version: \"${NEW_VERSION}\"/g" netlify/functions/npmplus-mcp.cjs
fi

echo -e "${GREEN}✅ Updated netlify function to v${NEW_VERSION}${NC}"

# Build the project
echo -e "${YELLOW}🔄 Building project...${NC}"
npm run build

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
if npm test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed. Please fix before continuing.${NC}"
    exit 1
fi

echo
echo -e "${GREEN}🎉 Version successfully bumped to v${NEW_VERSION}${NC}"
echo
echo "Next steps:"
echo -e "  ${BLUE}1.${NC} Review changes: git diff"
echo -e "  ${BLUE}2.${NC} Commit changes: git add . && git commit -m \"bump: version v${NEW_VERSION}\""
echo -e "  ${BLUE}3.${NC} Create tag: git tag v${NEW_VERSION}"
echo -e "  ${BLUE}4.${NC} Publish: npm publish"
echo -e "  ${BLUE}5.${NC} Deploy: npm run deploy:production"
echo