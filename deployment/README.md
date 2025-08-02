# Deployment Guide

This directory contains example deployment configurations that you can customize for your own deployment.

## Files to copy and customize:

1. **netlify.toml.example** → `netlify.toml` (in project root)
2. **netlify-functions/** → `netlify/functions/` (in project root)
3. **test-deployment.sh.example** → `scripts/test-deployment.sh`

## Setup Instructions:

### 1. For Netlify Deployment:
```bash
# Copy the example netlify config
cp deployment/netlify.toml.example netlify.toml

# Copy the netlify functions
cp -r deployment/netlify-functions netlify/functions

# Update the URLs in test-deployment.sh
cp deployment/test-deployment.sh.example scripts/test-deployment.sh
# Edit scripts/test-deployment.sh to use your domain
```

### 2. Update package.json scripts:
Add these scripts to your package.json:
```json
{
  "scripts": {
    "build:netlify": "npm run build && npm run copy:netlify",
    "copy:netlify": "echo 'Netlify functions ready'",
    "dev:netlify": "netlify dev",
    "test:deployment": "./scripts/test-deployment.sh",
    "deploy:netlify": "netlify deploy --prod"
  }
}
```

### 3. Environment Variables:
Set these in your deployment platform:
- `NODE_ENV=production`

## Customization:

- Replace `your-domain.com` with your actual domain
- Update the analytics endpoint URLs
- Modify CORS settings if needed
- Adjust timeout settings based on your needs

## Other Deployment Platforms:

This MCP server can be deployed to any Node.js hosting platform:
- Vercel
- Railway
- Heroku
- AWS Lambda
- Google Cloud Functions

Just adapt the configuration files for your chosen platform.