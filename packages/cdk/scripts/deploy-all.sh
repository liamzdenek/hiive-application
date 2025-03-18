#!/bin/bash

# Deploy both backend and frontend stacks

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "OPENROUTER_API_KEY is not set. Please set it before running this script."
  exit 1
fi

# Set AWS profile
export AWS_PROFILE=lz-demos
echo "Setting AWS_PROFILE to $AWS_PROFILE..."

# Build and deploy backend
echo "Building and deploying backend stack..."
cd "$(dirname "$0")/.."
npm run build

# Deploy backend stack
echo "Deploying backend stack with OpenRouter API key from environment variable to AWS profile $AWS_PROFILE..."
npx cdk deploy HiiveSentimentBackendStack --app "npx ts-node bin/app.ts" --require-approval never

# Get the API URL from the backend stack outputs
API_URL=$(aws cloudformation describe-stacks --stack-name HiiveSentimentBackendStack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

if [ -z "$API_URL" ]; then
  echo "Failed to get API URL from backend stack. Aborting frontend deployment."
  exit 1
fi

echo "Got API URL from backend stack: $API_URL"

# Build the frontend with the API URL
echo "Building frontend with API URL: $API_URL..."
cd "$(dirname "$0")/../../frontend"
VITE_API_BASE_URL=$API_URL npm run build
if [ $? -ne 0 ]; then
  echo "Failed to build frontend. Aborting deployment."
  exit 1
fi
cd "$(dirname "$0")/.."

# Deploy frontend stack (API URL is passed automatically from the backend stack)
echo "Deploying frontend stack..."
npx cdk deploy HiiveSentimentFrontendStack --app "npx ts-node bin/app.ts" --require-approval never

# Get the CloudFront URL from the frontend stack outputs
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name HiiveSentimentFrontendStack --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue" --output text)

if [ -z "$CLOUDFRONT_URL" ]; then
  echo "Failed to get CloudFront URL from frontend stack."
  exit 1
fi

echo "Deployment completed successfully!"
echo "Backend API URL: $API_URL"
echo "Frontend URL: https://$CLOUDFRONT_URL"