#!/bin/bash

# This script deploys the backend stack of the Hiive Sentiment Analyzer application.

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "AWS CDK is not installed. Please install it first with: npm install -g aws-cdk"
    exit 1
fi

# Check if OpenRouter API key is provided
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "OPENROUTER_API_KEY environment variable is not set."
    echo "Please set it with: export OPENROUTER_API_KEY=your-api-key"
    echo "Or run with: OPENROUTER_API_KEY=your-api-key ./scripts/deploy-backend.sh"
    exit 1
fi

# Navigate to the CDK directory
cd "$(dirname "$0")/.."

# Build the backend code
echo "Building backend code..."
cd ../backend
echo "Building backend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Backend build failed. Fixing TypeScript errors..."
    # Try to fix common TypeScript errors
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi
    
    # Try building again
    echo "Retrying backend build..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "Backend build failed again. Please fix the errors manually."
        exit 1
    fi
fi

# Navigate back to the CDK directory
cd ../cdk

# Build the CDK code
echo "Building CDK code..."
echo "Building CDK..."
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build CDK code."
    exit 1
fi

# Check if AWS_PROFILE is set to lz-demos
if [ "$AWS_PROFILE" != "lz-demos" ]; then
    echo "Setting AWS_PROFILE to lz-demos..."
    export AWS_PROFILE=lz-demos
fi

# Deploy the backend stack
echo "Deploying backend stack with OpenRouter API key from environment variable to AWS profile lz-demos..."
OPENROUTER_API_KEY=$OPENROUTER_API_KEY AWS_PROFILE=lz-demos cdk deploy HiiveSentimentBackendStack --app "npx ts-node bin/app.ts" --require-approval never

if [ $? -eq 0 ]; then
    echo "Backend stack deployed successfully!"
    
    # Get the API URL
    API_URL=$(aws cloudformation describe-stacks --stack-name HiiveSentimentBackendStack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
    
    if [ -n "$API_URL" ]; then
        echo "API URL: $API_URL"
        echo "You can test the API with: curl $API_URL/api/health"
        echo "You can test article submission with: curl -X POST -H \"Content-Type: application/json\" -d @test-article.json $API_URL/api/articles"
    fi
    
    # Get the S3 bucket name
    BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name HiiveSentimentBackendStack --query "Stacks[0].Outputs[?OutputKey=='ArticlesBucketName'].OutputValue" --output text)
    
    if [ -n "$BUCKET_NAME" ]; then
        echo "Articles S3 Bucket: $BUCKET_NAME"
        echo "You can use the desktop CLI to upload articles to this bucket."
    fi
else
    echo "Failed to deploy backend stack."
    exit 1
fi