# Hiive Sentiment Analyzer CDK

This directory contains the AWS CDK infrastructure code for the Hiive Sentiment Analyzer application.

## Prerequisites

- Node.js 20.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK installed globally (`npm install -g aws-cdk`)

## Project Structure

- `bin/`: Contains the CDK app entry point
- `lib/`: Contains the CDK stack definitions
  - `backend-stack/`: Backend infrastructure (API Gateway, Lambda, S3)
  - `frontend-stack/`: Frontend infrastructure (S3, CloudFront)
  - `pipeline-stack/`: CI/CD pipeline infrastructure
- `scripts/`: Contains utility scripts for deployment

## Deploying the Backend Stack

The backend stack includes:

- S3 bucket for article storage with lifecycle rules (sentiment files expire after 30 days)
- Lambda functions for API, article processing, and summary aggregation
- API Gateway for exposing the API endpoints
- CloudWatch Events for scheduled summary aggregation

To deploy the backend stack:

1. Make sure you have the AWS CLI configured with the `lz-demos` profile:
   ```bash
   aws configure --profile lz-demos
   ```

2. Set the OpenRouter API key as an environment variable:
   ```bash
   export OPENROUTER_API_KEY=your-openrouter-api-key
   ```

3. Run the deployment script:

```bash
cd packages/cdk
./scripts/deploy-backend.sh
```

The script will:
- Build the backend code
- Build the CDK code
- Deploy the backend stack to AWS

After successful deployment, the script will output:
- The API URL
- The S3 bucket name for articles

## Using the Desktop CLI

Once the backend is deployed, you can use the desktop CLI to upload articles to the S3 bucket:

```bash
cd packages/desktop
npm run build
node dist/index.js submit --file path/to/article.txt --company company-123 --source news
```

## Modifying the Infrastructure

If you need to modify the infrastructure:

1. Edit the appropriate stack file in the `lib/` directory
2. Build the CDK code:

```bash
cd packages/cdk
npm run build
```

3. Deploy the changes:

```bash
OPENROUTER_API_KEY=your-openrouter-api-key AWS_PROFILE=lz-demos cdk deploy HiiveSentimentBackendStack --app "npx ts-node bin/app.ts"
```

## Cleaning Up

To avoid incurring charges, you can destroy the deployed resources when they're no longer needed:

```bash
cd packages/cdk
AWS_PROFILE=lz-demos cdk destroy HiiveSentimentBackendStack --app "npx ts-node bin/app.ts"