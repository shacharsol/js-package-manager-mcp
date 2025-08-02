#!/usr/bin/env node

/**
 * Deploy script for MCP Hosting Service
 * This script registers the JavaScript Package Manager with the hosting service
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

const HOSTING_API = process.env.MCP_HOSTING_API || 'https://api.mcp-hosting.com';
const API_KEY = process.env.MCP_API_KEY;

async function deployToHosting() {
  if (!API_KEY) {
    console.error('❌ MCP_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    // Read package.json for metadata
    const packageJson = JSON.parse(
      await readFile(join(process.cwd(), 'package.json'), 'utf-8')
    );
    
    // Read MCP config
    const mcpConfig = JSON.parse(
      await readFile(join(process.cwd(), 'mcp-config.json'), 'utf-8')
    );

    const deploymentConfig = {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      repositoryUrl: packageJson.repository?.url || process.env.GITHUB_REPOSITORY,
      dockerFile: 'Dockerfile',
      buildCommand: 'npm run build',
      startCommand: 'node dist/index.js',
      healthCheck: '/health',
      environment: {
        NODE_ENV: 'production'
      },
      resources: {
        cpu: '250m',
        memory: '512Mi'
      },
      scaling: {
        minReplicas: 1,
        maxReplicas: 5,
        targetCPU: 70
      },
      mcpConfig: mcpConfig
    };

    console.log('🚀 Deploying to MCP Hosting Service...');
    console.log(`📦 Package: ${deploymentConfig.name}@${deploymentConfig.version}`);

    const response = await fetch(`${HOSTING_API}/admin/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(deploymentConfig)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deployment failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Deployment successful!');
    console.log(`🔗 Server ID: ${result.serverId}`);
    console.log(`🌐 Endpoint: ${HOSTING_API}${result.endpoint}`);
    console.log('');
    console.log('📋 Configuration for users:');
    console.log(JSON.stringify({
      mcpServers: {
        "javascript-package-manager": {
          transport: "http",
          url: `${HOSTING_API}${result.endpoint}`
        }
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployToHosting();