# Deployment Guide

This guide covers how to deploy NPM Plus in various environments.

## 🚀 Hosted Service (Recommended)

The easiest way to use NPM Plus is through our hosted service at `https://api.npmplus.dev/mcp`.

**Advantages:**
- ✅ No setup required
- ✅ Always up-to-date
- ✅ High availability
- ✅ Global CDN
- ✅ Monitoring and analytics

## 🏠 Self-Hosting Options

### Option 1: Netlify (Recommended for self-hosting)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/shacharsol/js-package-manager-mcp)

**Steps:**
1. Click the deploy button above
2. Connect your GitHub account
3. Configure environment variables (if needed)
4. Deploy

**Custom Domain:**
1. Add your domain in Netlify settings
2. Update your MCP configuration to use your domain

### Option 2: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuration:** Create `vercel.json`:
```json
{
  "functions": {
    "netlify/functions/*.cjs": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    { "source": "/mcp", "destination": "/netlify/functions/mcp" },
    { "source": "/health", "destination": "/netlify/functions/health" },
    { "source": "/analytics", "destination": "/netlify/functions/analytics" }
  ]
}
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Build and run:**
```bash
docker build -t npmplus-mcp .
docker run -p 3000:3000 npmplus-mcp
```

### Option 4: Traditional Server

**Requirements:**
- Node.js 16+ 
- npm/yarn/pnpm
- Process manager (PM2 recommended)

**Setup:**
```bash
# Clone and build
git clone https://github.com/shacharsol/js-package-manager-mcp.git
cd js-package-manager-mcp
npm install
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name npmplus-mcp
pm2 save
pm2 startup
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /mcp {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Optional: Custom cache TTLs (seconds)
CACHE_TTL_SEARCH=900          # Package search cache (15 min)
CACHE_TTL_INFO=3600           # Package info cache (1 hour)  
CACHE_TTL_VULNERABILITY=21600 # Vulnerability cache (6 hours)

# Optional: Rate limiting
RATE_LIMIT_REQUESTS=60        # Requests per minute
RATE_LIMIT_BURST=10          # Burst requests per second

# Optional: CORS settings
CORS_ORIGIN=*                # Allowed origins
CORS_METHODS=GET,POST,OPTIONS # Allowed methods

# Optional: Analytics
ANALYTICS_ENABLED=true       # Enable usage analytics
```

### MCP Client Configuration

Update your MCP client configuration to point to your deployment:

```json
{
  "mcpServers": {
    "javascript-package-manager": {
      "transport": "http",
      "url": "https://your-domain.com/mcp"
    }
  }
}
```

## 🧪 Testing Your Deployment

After deployment, test all endpoints:

```bash
# Clone the repo and run deployment tests
git clone https://github.com/shacharsol/js-package-manager-mcp.git
cd js-package-manager-mcp

# Edit the test script to use your domain
sed -i 's/api.npmplus.dev/your-domain.com/g' scripts/test-deployment.sh

# Run tests
./scripts/test-deployment.sh
```

## 📊 Monitoring

### Health Checks

Monitor these endpoints:
- `GET /health` - Service health
- `GET /analytics` - Analytics dashboard (if enabled)

### Metrics to Track

- **Response times**: Average and 95th percentile
- **Error rates**: 4xx and 5xx response rates
- **Usage patterns**: Most popular tools and features
- **Cache hit rates**: Efficiency of caching layer

### Logging

Structured logging is available:
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Tool executed successfully",
  "tool": "search_packages",
  "duration": 245,
  "cacheHit": true
}
```

## 🔐 Security Considerations

### Production Checklist

- [ ] **HTTPS Only**: Enforce SSL/TLS
- [ ] **Rate Limiting**: Implement appropriate limits
- [ ] **CORS**: Configure allowed origins
- [ ] **Monitoring**: Set up alerting
- [ ] **Updates**: Establish update procedures
- [ ] **Backups**: If using persistent storage
- [ ] **Secrets**: Use environment variables for sensitive data

### Security Headers

Recommended security headers:
```
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

## 🚨 Troubleshooting

### Common Issues

**1. Function timeouts**
- Increase timeout limits in your hosting platform
- Optimize package manager operations

**2. Memory issues**
- Monitor memory usage during large operations
- Implement request queuing for heavy operations

**3. Cache issues**
- Verify cache configuration
- Monitor cache hit rates

**4. CORS errors**
- Check allowed origins configuration
- Verify preflight request handling

### Getting Help

- **GitHub Issues**: [Report deployment issues](https://github.com/shacharsol/js-package-manager-mcp/issues)
- **Documentation**: [Check the docs](https://npmplus.dev)
- **Health Check**: Monitor `https://your-domain.com/health`

## 📈 Scaling

For high-traffic deployments:

1. **Load Balancing**: Use multiple instances behind a load balancer
2. **Caching**: Implement Redis for shared caching
3. **CDN**: Use a CDN for static assets and caching
4. **Database**: Consider persistent storage for analytics
5. **Monitoring**: Implement comprehensive monitoring and alerting

## 🔄 Updates

To update your deployment:

1. **Backup**: Backup configuration and data
2. **Test**: Test updates in staging environment
3. **Deploy**: Deploy during low-traffic periods
4. **Verify**: Run deployment tests
5. **Monitor**: Watch for issues post-deployment

## 📞 Support

For deployment support:
- **Community**: GitHub Discussions
- **Issues**: GitHub Issues for bugs
- **Contact**: [shachar@npmplus.dev](mailto:shachar@npmplus.dev) for enterprise support