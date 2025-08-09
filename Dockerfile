# Multi-stage build for faster deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies with optimizations
RUN npm ci --only=production --ignore-scripts --no-audit --no-fund

# Copy source code
COPY src ./src

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]