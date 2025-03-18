#!/bin/bash

#!/bin/bash

# Deploy the frontend to AWS
# This script builds the frontend and deploys it to AWS using CDK

# Check if API_URL is provided
if [ -z "$API_URL" ]; then
  echo "API_URL is required. Please provide the API URL."
  echo "Usage: API_URL=https://your-api-url.com ./deploy.sh"
  exit 1
fi

echo "Building frontend with API_URL: $API_URL"
# Ensure the shared package is available
mkdir -p node_modules/@hiive
cp -r ../shared node_modules/@hiive/

# Build the frontend with the correct environment variable
VITE_API_BASE_URL=$API_URL npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

echo "Frontend built successfully."

# Deploy using CDK
echo "Deploying to AWS using CDK..."
cd ../cdk

# Deploy the frontend stack (API URL is passed automatically from the backend stack)
npx cdk deploy HiiveSentimentFrontendStack --app "npx ts-node bin/app.ts" --require-approval never

# Check if deployment was successful
if [ $? -ne 0 ]; then
  echo "Deployment failed."
  exit 1
fi

# Get the CloudFront URL from the frontend stack outputs
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name HiiveSentimentFrontendStack --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue" --output text --profile lz-demos)

if [ -n "$CLOUDFRONT_URL" ]; then
  echo "Frontend deployed successfully!"
  echo "Frontend URL: https://$CLOUDFRONT_URL"
else
  echo "Frontend deployed, but couldn't retrieve the CloudFront URL."
fi