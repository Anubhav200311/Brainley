# Multi-stage build for the entire application
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source files
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-builder

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source files
COPY backend/ ./

# Build the TypeScript code
RUN npm run build

# Final stage
FROM node:18-alpine

# Create app directory structure
WORKDIR /app

# Copy backend built files
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package*.json /app/backend/
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules

# Copy frontend built files
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-builder /app/frontend/next.config.* /app/frontend/

# Copy start script
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 3001

# Start both services
CMD ["/app/start.sh"]