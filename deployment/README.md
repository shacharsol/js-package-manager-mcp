# Custom Deployment Guide

NPM Plus is available as a hosted service at `https://api.npmplus.dev/mcp` for easy use.

**This directory is for advanced users who want to deploy their own custom instance.**

## Why Deploy Your Own Instance?

- 🔒 **Privacy**: Keep your package queries on your own infrastructure
- ⚙️ **Customization**: Modify the server code for specific needs
- 🏢 **Enterprise**: Deploy behind your corporate firewall
- 🌍 **Regional**: Deploy closer to your location for lower latency

## 🔐 Security Note

**The hosted service at `https://api.npmplus.dev/mcp` is production infrastructure.** 

- 🚫 **Contributors cannot deploy** to the production service
- 🔒 **Only the maintainer** can trigger production deployments
- ✅ **Your custom deployment** gives you full control

This ensures the hosted service remains stable and secure for all users.

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