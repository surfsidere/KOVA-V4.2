# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /workspace

# Install git and other dependencies
RUN apk add --no-cache git bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy all project files
COPY . .

# Expose port 3000 for Next.js
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Default command
CMD ["npm", "run", "dev"]