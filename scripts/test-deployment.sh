#!/bin/bash

# NPM Plus Deployment Test Script
# Tests all API endpoints after deployment

set -e

BASE_URL="https://api.npmplus.dev"
MAIN_SITE="https://npmplus.dev"

echo "🚀 Testing NPM Plus deployment..."
echo "Base API URL: $BASE_URL"
echo "Main Site: $MAIN_SITE"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local description="$4"
    
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status) - $description"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($status, expected $expected_status) - $description"
        return 1
    fi
}

# Test MCP endpoint with proper request
test_mcp_endpoint() {
    echo -n "Testing MCP endpoint... "
    
    response=$(curl -s -X POST "$BASE_URL/mcp" \
        -H "Content-Type: application/json" \
        -d '{"method":"initialize","params":{}}')
    
    if echo "$response" | grep -q "protocolVersion"; then
        echo -e "${GREEN}✅ PASS${NC} - MCP initialization works"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - MCP initialization failed"
        echo "Response: $response"
        return 1
    fi
}

# Test analytics data endpoint
test_analytics_data() {
    echo -n "Testing Analytics data... "
    
    response=$(curl -s "$BASE_URL/analytics?data=true")
    
    if echo "$response" | grep -q "totalCalls"; then
        echo -e "${GREEN}✅ PASS${NC} - Analytics data returns JSON"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - Analytics data failed"
        echo "Response: $response"
        return 1
    fi
}

# Counter for failed tests
failed_tests=0

echo "🔍 Running endpoint tests..."
echo

# Test basic endpoints
test_endpoint "Health" "$BASE_URL/health" "200" "Health check endpoint" || ((failed_tests++))
test_endpoint "Analytics Dashboard" "$BASE_URL/analytics" "200" "Analytics dashboard loads" || ((failed_tests++))
test_endpoint "Main Website" "$MAIN_SITE" "200" "Main website loads" || ((failed_tests++))

echo

# Test MCP functionality
test_mcp_endpoint || ((failed_tests++))

echo

# Test analytics data
test_analytics_data || ((failed_tests++))

echo

# Test CORS headers
echo -n "Testing CORS headers... "
cors_header=$(curl -s -I -X OPTIONS "$BASE_URL/mcp" | grep -i "access-control-allow-origin" || true)
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✅ PASS${NC} - CORS headers present"
else
    echo -e "${RED}❌ FAIL${NC} - CORS headers missing"
    ((failed_tests++))
fi

echo

# Test redirects
echo -n "Testing API redirects... "
redirect_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/analytics-data")
if [ "$redirect_status" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - API redirects work"
else
    echo -e "${RED}❌ FAIL${NC} - API redirects failed ($redirect_status)"
    ((failed_tests++))
fi

echo

# Summary
echo "📊 Test Summary:"
echo "==============="

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is successful.${NC}"
    echo
    echo "✅ Health endpoint working"
    echo "✅ MCP server responding correctly"
    echo "✅ Analytics dashboard functional"
    echo "✅ Main website accessible"
    echo "✅ CORS headers configured"
    echo "✅ API redirects working"
    echo
    echo "🚀 NPM Plus is ready for use!"
    exit 0
else
    echo -e "${RED}❌ $failed_tests test(s) failed. Please check the deployment.${NC}"
    echo
    echo "🔧 Common fixes:"
    echo "  - Wait a few minutes for Netlify deployment to complete"
    echo "  - Check Netlify function logs for errors"
    echo "  - Verify DNS settings for custom domains"
    echo "  - Check that all .cjs files are committed"
    exit 1
fi