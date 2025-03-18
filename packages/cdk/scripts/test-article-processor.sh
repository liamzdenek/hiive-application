#!/bin/bash

# This script tests the article processor Lambda by uploading a test article to S3

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS_PROFILE is set to lz-demos
if [ "$AWS_PROFILE" != "lz-demos" ]; then
    echo "Setting AWS_PROFILE to lz-demos..."
    export AWS_PROFILE=lz-demos
fi

# Get the S3 bucket name from CloudFormation
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name HiiveSentimentBackendStack --query "Stacks[0].Outputs[?OutputKey=='ArticlesBucketName'].OutputValue" --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo "Could not find the S3 bucket name. Make sure the stack is deployed."
    exit 1
fi

echo "Found S3 bucket: $BUCKET_NAME"

# Check if test-article.json exists
if [ ! -f "../test-article.json" ] && [ ! -f "../../test-article.json" ]; then
    echo "test-article.json not found. Creating a sample article..."
    
    # Create a sample article
    cat > test-article.json << EOL
{
  "companyId": "company-123",
  "title": "Example Tech Inc. Reports Strong Q1 Growth",
  "content": "Example Tech Inc. today announced its Q1 2025 financial results, reporting a 25% increase in revenue compared to the same period last year. The company's cloud services division saw particularly strong growth, with revenue up 40% year-over-year. CEO Jane Smith attributed the growth to increased enterprise adoption of the company's AI-powered solutions. 'Our investments in artificial intelligence are paying off as more businesses recognize the value of our platform,' said Smith. The company also announced plans to expand into new markets in Europe and Asia, with several strategic partnerships already in place. Despite some concerns about increasing competition in the market, analysts remain positive about the company's prospects, citing its strong product pipeline and innovative approach to customer solutions. The company's stock price rose 5% following the announcement.",
  "source": "financial-times",
  "publicationDate": "2025-03-15T10:30:00Z",
  "url": "https://example.com/article",
  "author": "John Doe",
  "tags": ["earnings", "financial-results", "tech-sector", "growth"]
}
EOL
    echo "Sample article created."
    TEST_ARTICLE_PATH="test-article.json"
else
    # Use the existing test article
    if [ -f "../test-article.json" ]; then
        TEST_ARTICLE_PATH="../test-article.json"
    else
        TEST_ARTICLE_PATH="../../test-article.json"
    fi
    echo "Using existing test article: $TEST_ARTICLE_PATH"
fi

# Generate a timestamp and unique ID for the article
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
UUID=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 8 | head -n 1)
KEY="articles/company-123/${TIMESTAMP}-${UUID}.json"

echo "Uploading article to S3: s3://$BUCKET_NAME/$KEY"

# Upload the article to S3
aws s3 cp $TEST_ARTICLE_PATH "s3://$BUCKET_NAME/$KEY"

if [ $? -eq 0 ]; then
    echo "Article uploaded successfully."
    echo "The article processor Lambda should be triggered automatically."
    echo "Wait a few seconds for the Lambda to process the article..."
    sleep 5
    
    # Check if the analysis file was created
    ANALYSIS_PREFIX="analysis/company-123/"
    echo "Checking for analysis files..."
    aws s3 ls "s3://$BUCKET_NAME/$ANALYSIS_PREFIX"
    
    # Check if the summary file was created
    SUMMARY_KEY="summaries/company-123/latest.json"
    echo "Checking for summary file..."
    aws s3 ls "s3://$BUCKET_NAME/$SUMMARY_KEY"
    
    echo "You can download and view the analysis with:"
    echo "aws s3 cp s3://$BUCKET_NAME/$ANALYSIS_PREFIX<latest-file> analysis.json"
    echo "aws s3 cp s3://$BUCKET_NAME/$SUMMARY_KEY summary.json"
else
    echo "Failed to upload article to S3."
    exit 1
fi