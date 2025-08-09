#!/usr/bin/env node

/**
 * Slim build script for container deployments
 * Reduces build time by skipping dev dependencies and tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting slim build...');

// Skip heavy dev dependencies during install
process.env.NODE_ENV = 'production';

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Install only production dependencies
  console.log('📦 Installing production dependencies...');
  execSync('npm ci --only=production --ignore-scripts --no-audit --no-fund', {
    stdio: 'inherit',
    timeout: 300000 // 5 minutes max
  });

  // Build TypeScript
  console.log('🔨 Building TypeScript...');
  execSync('npx tsc --skipLibCheck', {
    stdio: 'inherit',
    timeout: 180000 // 3 minutes max
  });

  console.log('✅ Slim build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}