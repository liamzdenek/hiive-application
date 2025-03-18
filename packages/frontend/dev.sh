#!/bin/bash

# Ensure the shared package is available
mkdir -p node_modules/@hiive
cp -r ../shared node_modules/@hiive/

# Start the frontend development server with the API URL from environment variable or default
if [ -z "$API_URL" ]; then
  echo "API_URL not set, using default from .env file"
  npm run dev
else
  echo "Using API_URL: $API_URL"
  VITE_API_BASE_URL=$API_URL npm run dev
fi