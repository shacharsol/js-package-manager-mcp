# Deployment Guide

This directory contains example deployment configurations that you can customize for your own deployment.

## Quick Setup (Automated):

```bash
# Run the setup script to create all deployment files locally
./deployment/setup-deployment.sh
```

This will create:
- `netlify.toml` (gitignored)
- `netlify/functions/` (gitignored)  
- `scripts/test-deployment.sh` (gitignored)
- `package.user.json` (gitignored) - contains deployment scripts

## Manual Setup:

### 1. Copy deployment files:
```bash
cp deployment/netlify.toml.example netlify.toml
cp -r deployment/netlify-functions netlify/functions
cp deployment/test-deployment.sh.example scripts/test-deployment.sh
cp deployment/package.user.json.example package.user.json
chmod +x scripts/test-deployment.sh
```

### 2. Install deployment dependencies:
```bash
npm install --save-dev netlify-cli
```

### 3. Customize your deployment:
- Edit `scripts/test-deployment.sh` to use your domain URLs
- Modify `netlify.toml` if needed for your configuration

### 4. Environment Variables:
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