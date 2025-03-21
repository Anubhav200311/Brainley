#!/bin/sh

# This script is for local development only
# For production, use docker-compose up

echo "Starting Brainley in development mode..."
echo "Starting PostgreSQL, Backend, and Frontend services..."

docker compose up

