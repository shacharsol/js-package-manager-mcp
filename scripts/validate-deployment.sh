#!/bin/bash

# Deployment Validation Script
# Run this after deploying to production to validate all features are working

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "================================================"
echo "🚀 npmplus MCP Deployment Validation"
echo "================================================"
echo ""

# Check if production URL is accessible
echo -e "${YELLOW}Checking production endpoint...${NC}"
PRODUCTION_URL="https://api.npmplus.dev/mcp"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" || echo "000")

if [ "$HTTP_STATUS" -eq 404 ] || [ "$HTTP_STATUS" -eq 405 ]; then
    echo -e "${GREEN}✅ Production endpoint is accessible (HTTP $HTTP_STATUS - expected for GET)${NC}"
elif [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Production endpoint is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Production endpoint returned unexpected status: $HTTP_STATUS${NC}"
    echo "   URL: $PRODUCTION_URL"
    exit 1
fi

echo ""

# Run the test suite
echo -e "${YELLOW}Running deployment validation tests...${NC}"
echo ""

# Build the project first if dist doesn't exist
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
fi

# Run the specific deployment validation test
npm test -- src/__tests__/deployment-validation.test.ts --verbose

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT VALIDATION SUCCESSFUL${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "All critical features are working correctly!"
    echo ""
    
    # Show version info
    VERSION=$(node -p "require('./package.json').version")
    echo "Deployed version: v$VERSION"
    echo "Production URL: $PRODUCTION_URL"
    
    exit 0
else
    echo ""
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}❌ DEPLOYMENT VALIDATION FAILED${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo "Some tests failed. Please check the output above."
    echo ""
    exit 1
fi