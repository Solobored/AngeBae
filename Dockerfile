# Multi-stage build for Next.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

COPY . .

# Build Next.js
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm install --legacy-peer-deps --omit=dev

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy lib, scripts, and other necessary directories
COPY lib ./lib
COPY scripts ./scripts

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
