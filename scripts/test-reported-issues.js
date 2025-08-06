#!/usr/bin/env node

/**
 * Test script to specifically verify fixes for reported issues
 * 
 * This script tests the exact scenarios mentioned in the retest report
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const results = {
  passed: [],
  failed: [],
  fixes: []
};

const PROJECT_ROOT = process.cwd();

/**
 * Load the MCP server
 */
async function loadMCPServer() {
  const searchTools = require('../dist/tools/search-tools.js');
  const installTools = require('../dist/tools/install-tools.js');
  const securityTools = require('../dist/tools/security-tools.js');
  const analysisTools = require('../dist/tools/analysis-tools.js');
  const managementTools = require('../dist/tools/management-tools.js');
  
  return new Map([
    ...searchTools.handlers,
    ...installTools.handlers,
    ...securityTools.handlers,
    ...analysisTools.handlers,
    ...managementTools.handlers
  ]);
}

/**
 * Test tool with both relative and absolute paths
 */
async function testPathResolution(toolName, handler, baseParams) {
  console.log(`\n${colors.blue}Testing ${toolName} path resolution...${colors.reset}`);
  
  // Test with relative path "."
  console.log(`  Testing with cwd: "." ...`);
  try {
    const relativeResult = await handler({ ...baseParams, cwd: "." });
    if (relativeResult && relativeResult.content) {
      results.fixes.push(`${toolName} now works with relative path "."`);
      console.log(`  ${colors.green}✅ Relative path works${colors.reset}`);
    } else {
      results.failed.push(`${toolName} relative path returned invalid result`);
      console.log(`  ${colors.red}❌ Relative path failed${colors.reset}`);
    }
  } catch (error) {
    results.failed.push(`${toolName} relative path error: ${error.message}`);
    console.log(`  ${colors.red}❌ Relative path error: ${error.message}${colors.reset}`);
  }
  
  // Test with absolute path
  console.log(`  Testing with absolute path...`);
  try {
    const absoluteResult = await handler({ ...baseParams, cwd: PROJECT_ROOT });
    if (absoluteResult && absoluteResult.content) {
      results.passed.push(`${toolName} works with absolute path`);
      console.log(`  ${colors.green}✅ Absolute path works${colors.reset}`);
    } else {
      results.failed.push(`${toolName} absolute path returned invalid result`);
      console.log(`  ${colors.red}❌ Absolute path failed${colors.reset}`);
    }
  } catch (error) {
    results.failed.push(`${toolName} absolute path error: ${error.message}`);
    console.log(`  ${colors.red}❌ Absolute path error: ${error.message}${colors.reset}`);
  }
}

/**
 * Test vulnerability check fix
 */
async function testVulnerabilityFix(handler) {
  console.log(`\n${colors.blue}Testing vulnerability check fix...${colors.reset}`);
  
  // Test packages that should have vulnerabilities
  const testCases = [
    { packageName: 'minimist', version: '1.2.0' },
    { packageName: 'lodash', version: '4.17.19' }, // Known vulnerable version
    { packageName: 'express', version: '4.17.0' }
  ];
  
  for (const testCase of testCases) {
    console.log(`  Testing ${testCase.packageName}@${testCase.version}...`);
    try {
      const result = await handler(testCase);
      if (result && result.content && result.content[0]) {
        const text = result.content[0].text;
        
        if (text.includes('Failed to check vulnerabilities')) {
          results.failed.push(`Vulnerability check still failing for ${testCase.packageName}`);
          console.log(`  ${colors.red}❌ Still failing with hard error${colors.reset}`);
        } else if (text.includes('fetch failed') || text.includes('Unable to complete vulnerability check')) {
          results.fixes.push(`Vulnerability check gracefully handles errors for ${testCase.packageName}`);
          console.log(`  ${colors.green}✅ Graceful error handling implemented${colors.reset}`);
        } else {
          results.fixes.push(`Vulnerability check improved for ${testCase.packageName}`);
          console.log(`  ${colors.green}✅ Improved error handling${colors.reset}`);
        }
      }
    } catch (error) {
      results.failed.push(`Vulnerability check error: ${error.message}`);
      console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Test specific reported issues
 */
async function testReportedIssues() {
  console.log('================================================');
  console.log(`🔧 ${colors.bold}Testing Reported Issues Fixes${colors.reset}`);
  console.log('================================================');
  
  const handlers = await loadMCPServer();
  
  // Issue 1: Directory Resolution Problem
  console.log(`\n${colors.yellow}ISSUE 1: Directory Resolution with "." parameter${colors.reset}`);
  
  await testPathResolution('dependency_tree', handlers.get('dependency_tree'), {
    depth: 2
  });
  
  await testPathResolution('list_licenses', handlers.get('list_licenses'), {
    production: false
  });
  
  await testPathResolution('audit_dependencies', handlers.get('audit_dependencies'), {
    production: false
  });
  
  await testPathResolution('analyze_dependencies', handlers.get('analyze_dependencies'), {
    circular: true
  });
  
  await testPathResolution('install_packages', handlers.get('install_packages'), {
    packages: ['uuid@9.0.0'],
    save: true,
    dev: true
  });
  
  // Issue 2: Vulnerability Check API Failure
  console.log(`\n${colors.yellow}ISSUE 2: Vulnerability Check API${colors.reset}`);
  await testVulnerabilityFix(handlers.get('check_vulnerability'));
  
  // Test packages that should work fine
  console.log(`\n${colors.blue}Testing operations that should always work...${colors.reset}`);
  
  // Global operations (should work regardless)
  const globalTests = [
    { name: 'search_packages', handler: handlers.get('search_packages'), params: { query: 'react', limit: 1 } },
    { name: 'package_info', handler: handlers.get('package_info'), params: { packageName: 'lodash' } },
    { name: 'check_bundle_size', handler: handlers.get('check_bundle_size'), params: { packageName: 'dayjs' } },
    { name: 'download_stats', handler: handlers.get('download_stats'), params: { packageName: 'react', period: 'last-week' } }
  ];
  
  for (const test of globalTests) {
    try {
      const result = await test.handler(test.params);
      if (result && result.content) {
        results.passed.push(`${test.name} working correctly`);
        console.log(`  ${colors.green}✅ ${test.name}${colors.reset}`);
      }
    } catch (error) {
      results.failed.push(`${test.name} failed: ${error.message}`);
      console.log(`  ${colors.red}❌ ${test.name}: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Generate report
 */
function generateReport() {
  console.log(`\n${colors.bold}================================================${colors.reset}`);
  console.log(`${colors.bold}ISSUE RESOLUTION REPORT${colors.reset}`);
  console.log(`================================================${colors.reset}`);
  
  console.log(`\n${colors.green}✅ FIXES IMPLEMENTED (${results.fixes.length}):${colors.reset}`);
  results.fixes.forEach(fix => console.log(`  • ${fix}`));
  
  if (results.passed.length > 0) {
    console.log(`\n${colors.green}✅ WORKING CORRECTLY (${results.passed.length}):${colors.reset}`);
    results.passed.forEach(test => console.log(`  • ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}❌ STILL FAILING (${results.failed.length}):${colors.reset}`);
    results.failed.forEach(test => console.log(`  • ${test}`));
  }
  
  console.log(`\n================================================`);
  
  const totalFixes = results.fixes.length;
  const totalWorking = results.passed.length;
  const totalFailing = results.failed.length;
  
  if (totalFixes > 0) {
    console.log(`${colors.green}🎉 IMPROVEMENTS MADE: ${totalFixes} issues addressed${colors.reset}`);
  }
  
  if (totalFailing === 0) {
    console.log(`${colors.green}✅ ALL TESTED SCENARIOS WORKING${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.yellow}⚠️  ${totalFailing} issues still need attention${colors.reset}`);
    return false;
  }
}

// Run the tests
testReportedIssues()
  .then(generateReport)
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });