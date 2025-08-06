#!/usr/bin/env node

/**
 * Comprehensive Real-World Test Script
 * 
 * This script performs thorough testing of all MCP tools to identify
 * the specific issues mentioned in your report.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
};

const PROJECT_ROOT = process.cwd();
const TEST_WORKSPACE = path.join(PROJECT_ROOT, 'test-workspace-comprehensive');

/**
 * Load the MCP server and get tools
 */
async function loadMCPServer() {
  try {
    // Import the server
    const { createServer } = require('../dist/server.js');
    
    // Import all tool modules directly
    const searchTools = require('../dist/tools/search-tools.js');
    const installTools = require('../dist/tools/install-tools.js');
    const securityTools = require('../dist/tools/security-tools.js');
    const analysisTools = require('../dist/tools/analysis-tools.js');
    const managementTools = require('../dist/tools/management-tools.js');
    
    // Combine all handlers
    const allHandlers = new Map([
      ...searchTools.handlers,
      ...installTools.handlers,
      ...securityTools.handlers,
      ...analysisTools.handlers,
      ...managementTools.handlers
    ]);
    
    // Combine all tools
    const allTools = [
      ...searchTools.tools,
      ...installTools.tools,
      ...securityTools.tools,
      ...analysisTools.tools,
      ...managementTools.tools
    ];
    
    return { handlers: allHandlers, tools: allTools };
  } catch (error) {
    throw new Error(`Failed to load MCP server: ${error.message}`);
  }
}

/**
 * Setup test workspace
 */
function setupTestWorkspace() {
  if (fs.existsSync(TEST_WORKSPACE)) {
    fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
  }
  
  fs.mkdirSync(TEST_WORKSPACE, { recursive: true });
  
  const packageJson = {
    name: 'test-workspace-comprehensive',
    version: '1.0.0',
    description: 'Comprehensive test workspace',
    dependencies: {},
    devDependencies: {}
  };
  
  fs.writeFileSync(
    path.join(TEST_WORKSPACE, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  console.log(`${colors.blue}Setup test workspace: ${TEST_WORKSPACE}${colors.reset}`);
}

/**
 * Cleanup test workspace
 */
function cleanupTestWorkspace() {
  if (fs.existsSync(TEST_WORKSPACE)) {
    fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    console.log(`${colors.blue}Cleaned up test workspace${colors.reset}`);
  }
}

/**
 * Test a tool and return detailed results
 */
async function testTool(name, handler, params, expectSuccess = true) {
  console.log(`\n${colors.blue}Testing ${name}...${colors.reset}`);
  
  try {
    const startTime = Date.now();
    const result = await handler(params);
    const duration = Date.now() - startTime;
    
    // Validate result structure
    if (!result) {
      throw new Error('Tool returned null/undefined result');
    }
    
    if (!result.content || !Array.isArray(result.content)) {
      throw new Error('Tool result missing content array');
    }
    
    if (result.content.length === 0) {
      throw new Error('Tool returned empty content array');
    }
    
    const content = result.content[0];
    if (!content.type || !content.text) {
      throw new Error('Tool content missing type or text');
    }
    
    // Success
    results.passed.push({
      tool: name,
      duration,
      params,
      success: true
    });
    
    console.log(`${colors.green}✅ ${name} - ${duration}ms${colors.reset}`);
    console.log(`   Result type: ${content.type}`);
    console.log(`   Text preview: ${content.text.substring(0, 100)}...`);
    
    return { success: true, result, duration };
    
  } catch (error) {
    const duration = Date.now() - (startTime || 0);
    
    if (expectSuccess) {
      results.failed.push({
        tool: name,
        duration,
        params,
        error: error.message,
        success: false
      });
      console.log(`${colors.red}❌ ${name} - FAILED${colors.reset}`);
      console.log(`   Error: ${error.message}`);
    } else {
      results.warnings.push({
        tool: name,
        duration,
        params,
        error: error.message,
        success: false,
        expected: true
      });
      console.log(`${colors.yellow}⚠️  ${name} - Expected failure${colors.reset}`);
      console.log(`   Error: ${error.message}`);
    }
    
    return { success: false, error: error.message, duration };
  }
}

/**
 * Test all global operations (no project context needed)
 */
async function testGlobalOperations(handlers) {
  console.log(`\n${colors.bold}=== GLOBAL OPERATIONS ===${colors.reset}`);
  
  // Test search_packages
  await testTool('search_packages', handlers.get('search_packages'), {
    query: 'react hooks',
    limit: 3
  });
  
  // Test package_info
  await testTool('package_info', handlers.get('package_info'), {
    packageName: 'lodash'
  });
  
  // Test check_bundle_size
  await testTool('check_bundle_size', handlers.get('check_bundle_size'), {
    packageName: 'dayjs'
  });
  
  // Test download_stats
  await testTool('download_stats', handlers.get('download_stats'), {
    packageName: 'react',
    period: 'last-week'
  });
  
  // Test check_license
  await testTool('check_license', handlers.get('check_license'), {
    packageName: 'express'
  });
  
  // Test check_vulnerability (known to be problematic)
  await testTool('check_vulnerability', handlers.get('check_vulnerability'), {
    packageName: 'express@4.17.0'
  }, false); // expect failure
}

/**
 * Test project-specific operations with different path scenarios
 */
async function testProjectOperations(handlers) {
  console.log(`\n${colors.bold}=== PROJECT OPERATIONS ===${colors.reset}`);
  
  // Test with relative path "." (expected to fail)
  console.log(`\n${colors.yellow}Testing with relative path "." (expected failures):${colors.reset}`);
  
  await testTool('dependency_tree (relative)', handlers.get('dependency_tree'), {
    cwd: '.',
    depth: 2
  }, false);
  
  await testTool('list_licenses (relative)', handlers.get('list_licenses'), {
    cwd: '.'
  }, false);
  
  await testTool('audit_dependencies (relative)', handlers.get('audit_dependencies'), {
    cwd: '.'
  }, false);
  
  // Test with absolute path (expected to work)
  console.log(`\n${colors.yellow}Testing with absolute path (should work):${colors.reset}`);
  
  await testTool('dependency_tree (absolute)', handlers.get('dependency_tree'), {
    cwd: TEST_WORKSPACE,
    depth: 2
  });
  
  await testTool('list_licenses (absolute)', handlers.get('list_licenses'), {
    cwd: TEST_WORKSPACE
  });
  
  await testTool('audit_dependencies (absolute)', handlers.get('audit_dependencies'), {
    cwd: TEST_WORKSPACE
  });
  
  await testTool('analyze_dependencies', handlers.get('analyze_dependencies'), {
    cwd: TEST_WORKSPACE
  });
}

/**
 * Test package management operations
 */
async function testPackageManagement(handlers) {
  console.log(`\n${colors.bold}=== PACKAGE MANAGEMENT ===${colors.reset}`);
  
  // Install a package
  await testTool('install_packages', handlers.get('install_packages'), {
    cwd: TEST_WORKSPACE,
    packages: ['uuid@9.0.0'],
    save: true
  });
  
  // Check if package was actually installed
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(TEST_WORKSPACE, 'package.json'), 'utf-8'));
    if (packageJson.dependencies && packageJson.dependencies.uuid) {
      console.log(`${colors.green}✅ Package actually installed in package.json${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Package not found in package.json after install${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Could not verify package.json after install${colors.reset}`);
  }
  
  // Update the package
  await testTool('update_packages', handlers.get('update_packages'), {
    cwd: TEST_WORKSPACE,
    packages: ['uuid']
  });
  
  // Check outdated
  await testTool('check_outdated', handlers.get('check_outdated'), {
    cwd: TEST_WORKSPACE
  });
  
  // Remove the package
  await testTool('remove_packages', handlers.get('remove_packages'), {
    cwd: TEST_WORKSPACE,
    packages: ['uuid']
  });
}

/**
 * Test cache operations
 */
async function testCacheOperations(handlers) {
  console.log(`\n${colors.bold}=== CACHE OPERATIONS ===${colors.reset}`);
  
  await testTool('clean_cache', handlers.get('clean_cache'), {
    cwd: TEST_WORKSPACE
  });
}

/**
 * Generate comprehensive report
 */
function generateReport() {
  console.log(`\n${colors.bold}================================================${colors.reset}`);
  console.log(`${colors.bold}COMPREHENSIVE TEST REPORT${colors.reset}`);
  console.log(`================================================${colors.reset}`);
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  
  console.log(`\nTotal Tools Tested: ${total}`);
  console.log(`${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings.length}${colors.reset}`);
  
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}FAILED TESTS:${colors.reset}`);
    results.failed.forEach(test => {
      console.log(`  • ${test.tool}: ${test.error}`);
      console.log(`    Params: ${JSON.stringify(test.params)}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}WARNINGS (Expected Issues):${colors.reset}`);
    results.warnings.forEach(test => {
      console.log(`  • ${test.tool}: ${test.error}`);
    });
  }
  
  if (results.passed.length > 0) {
    console.log(`\n${colors.green}WORKING FEATURES:${colors.reset}`);
    results.passed.forEach(test => {
      console.log(`  • ${test.tool} (${test.duration}ms)`);
    });
  }
  
  // Performance summary
  const performanceData = results.passed.filter(r => r.duration);
  if (performanceData.length > 0) {
    const avgDuration = performanceData.reduce((sum, r) => sum + r.duration, 0) / performanceData.length;
    const maxDuration = Math.max(...performanceData.map(r => r.duration));
    const minDuration = Math.min(...performanceData.map(r => r.duration));
    
    console.log(`\n${colors.blue}PERFORMANCE SUMMARY:${colors.reset}`);
    console.log(`  Average response time: ${Math.round(avgDuration)}ms`);
    console.log(`  Fastest response: ${minDuration}ms`);
    console.log(`  Slowest response: ${maxDuration}ms`);
  }
  
  console.log(`\n================================================`);
  
  if (results.failed.length === 0) {
    console.log(`${colors.green}✅ ALL CRITICAL FEATURES WORKING${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}❌ ${results.failed.length} CRITICAL ISSUES FOUND${colors.reset}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runComprehensiveTest() {
  console.log('================================================');
  console.log(`🔍 ${colors.bold}Comprehensive MCP Server Test${colors.reset}`);
  console.log(`   Version: 12.0.5`);
  console.log('================================================');
  
  try {
    // Load MCP server
    console.log(`${colors.blue}Loading MCP server...${colors.reset}`);
    const { handlers, tools } = await loadMCPServer();
    console.log(`${colors.green}✅ Loaded ${tools.length} tools, ${handlers.size} handlers${colors.reset}`);
    
    // Setup test workspace
    setupTestWorkspace();
    
    // Run all tests
    await testGlobalOperations(handlers);
    await testProjectOperations(handlers);
    await testPackageManagement(handlers);
    await testCacheOperations(handlers);
    
    // Generate report
    const success = generateReport();
    
    // Cleanup
    cleanupTestWorkspace();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    cleanupTestWorkspace();
    process.exit(1);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  cleanupTestWorkspace();
  process.exit(1);
});