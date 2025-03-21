#!/bin/sh

echo "Starting services in container environment..."

# Check if we're in the expected directory structure
if [ ! -d "/app/backend" ] || [ ! -d "/app/frontend" ]; then
  echo "Error: Container directory structure not found"
  echo "This script is meant to run inside the Docker container"
  exit 1
fi

# Start the backend in the background
echo "Starting backend service..."
cd /app/backend
node dist/index.js &
BACKEND_PID=$!

# Start the frontend
echo "Starting frontend service..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

echo "Both services started successfully"

# Handle termination
trap 'echo "Shutting down services..."; kill $BACKEND_PID $FRONTEND_PID; exit' SIGINT SIGTERM

# Keep the container running
wait $BACKEND_PID $FRONTEND_PID