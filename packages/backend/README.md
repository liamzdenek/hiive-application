# Hiive AI Market Sentiment Analyzer - Backend

This is the backend for the Hiive AI Market Sentiment Analyzer, a demo application that showcases how Agentic AI can enhance Hiive's private market data insights.

## Features

- Express API for sentiment analysis
- AWS Lambda integration using serverless-http
- S3 storage for articles and analysis results
- AI-powered sentiment analysis using OpenRouter API
- Event-driven architecture with S3 event notifications

## Technology Stack

- Node.js 20.x
- Express
- TypeScript
- AWS Lambda
- AWS API Gateway
- AWS S3
- OpenRouter API for LLM access

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- AWS CLI configured with appropriate credentials

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/companies/{companyId}/sentiment` - Get sentiment data for a company
- `GET /api/companies/{companyId}/sentiment/history` - Get sentiment history for a company
- `POST /api/companies/{companyId}/sentiment/refresh` - Refresh sentiment data for a company
- `GET /api/companies/{companyId}/articles` - Get articles for a company
- `POST /api/articles` - Submit an article for sentiment analysis

## AWS Lambda Integration

The backend uses the `serverless-http` library to integrate Express with AWS Lambda. This simplifies the integration by handling all the request/response mapping automatically.

```typescript
import serverless from 'serverless-http';
import app from './index';

// Create a serverless handler for the Express app
export const apiHandler = serverless(app, {
  // Configuration options
  requestId: 'awsRequestId',
  
  // Add custom request/response handling
  request: (request, event, context) => {
    // Custom request handling
  },
  response: (response) => {
    // Custom response handling
  }
});

// Export a promise-based handler for more flexibility
export const handler = async (event, context) => {
  try {
    // Additional processing before handling the request
    const result = await apiHandler(event, context);
    // Additional processing after handling the request
    return result;
  } catch (error) {
    // Error handling
  }
};
```

## Deployment

The backend is deployed using AWS CDK. The infrastructure is defined in the `packages/cdk` directory.

```bash
# Deploy using CDK
cd ../cdk
npm run deploy
```

## Project Structure

- `src/index.ts` - Express application
- `src/lambda.ts` - AWS Lambda handler
- `src/handlers/` - Lambda function handlers
- `src/agents/` - AI agent implementations
- `src/middleware/` - Express middleware
- `src/utils/` - Utility functions