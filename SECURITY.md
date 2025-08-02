# Security Policy

## Production Infrastructure Protection

### 🔒 Hosted Service Security

The production service at `https://api.npmplus.dev/mcp` is protected infrastructure:

- **Only maintainers** can deploy to production
- **Automatic deployments are disabled** for security
- **Contributors cannot trigger** production builds
- **Manual deployment verification** ensures stability

### 🛡️ For Contributors

When contributing to this project:

- ✅ **Your changes will be reviewed** before any production deployment
- ✅ **You can test locally** using the self-deployment guide
- ✅ **CI/CD tests** ensure code quality without production access
- ✅ **Your contributions are valued** and will be properly credited

### 🏢 For Enterprise Users

For production enterprise deployments:

- **Deploy your own instance** using the deployment guide
- **Control your own infrastructure** and security policies
- **Customize as needed** for your environment
- **Full ownership** of your deployment and data

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. **Email directly** to: shachar@npmplus.dev
3. **Include details** about the vulnerability
4. **We will respond** within 24 hours

## Security Best Practices

When self-deploying:

- ✅ Use **environment variables** for sensitive configuration
- ✅ Enable **HTTPS** for all endpoints
- ✅ Set up **rate limiting** for production use
- ✅ Monitor **access logs** and usage patterns
- ✅ Keep **dependencies updated** regularly

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes            |
| < 1.0   | ❌ No             |

Only the latest version receives security updates.