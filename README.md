# Hiive AI Market Sentiment Analyzer

A demo application that showcases how Agentic AI can enhance Hiive's private market data insights. The application analyzes market sentiment for pre-IPO companies by processing news articles, social media, and financial reports to provide Hiive users with deeper insights into potential investments.

## Project Structure

This project is organized as a monorepo using Nx workspace with the following packages:

- **frontend**: React/TypeScript application for the UI
- **backend**: Node.js/Express/TypeScript serverless functions
- **desktop**: Node.js CLI application for article submission
- **shared**: Common types, constants, and utilities
- **cdk**: AWS CDK infrastructure code

## Prerequisites

- Node.js 20.x LTS
- npm or yarn
- Git
- AWS CLI (for deployment)
- AWS CDK CLI (for deployment)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hiive/sentiment-analyzer.git
   cd sentiment-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   This will install dependencies for the root project and all packages using Nx workspace.

### Development

This project uses Nx for managing the monorepo. Here are some common commands:

To run the frontend development server:

```bash
nx run frontend:dev
# or
npm run dev:frontend
```

To run the backend development server:

```bash
nx run backend:dev
# or
npm run dev:backend
```

### Building

To build all packages:

```bash
nx run-many --target=build --all
# or
npm run build
```

To build a specific package:

```bash
nx build <package-name>
# Example: nx build frontend
```

### Testing

To run tests for all packages:

```bash
nx run-many --target=test --all
# or
npm run test
```

To test a specific package:

```bash
nx test <package-name>
# Example: nx test backend
```

### Linting

To lint all packages:

```bash
nx run-many --target=lint --all
# or
npm run lint
```

To lint a specific package:

```bash
nx lint <package-name>
# Example: nx lint shared
```

### Nx Commands

Nx provides many useful commands for working with a monorepo:

```bash
# Show dependency graph
nx graph

# Run a target for a specific project
nx run <project>:<target>

# Run a target for all projects
nx run-many --target=<target> --all

# Run a target for projects affected by changes
nx affected --target=<target>
```

## Desktop CLI Tool

The desktop CLI tool allows you to submit articles for sentiment analysis:

```bash
# Build the desktop package
nx build desktop

# Run the CLI tool
node dist/packages/desktop/index.js submit --file <path-to-article> --company <company-id> --source <source-name> --tags <comma-separated-tags>
```

## Deployment

The application can be deployed to AWS using the CDK. We provide several deployment scripts for convenience:

### Deploy Backend Only

```bash
# Set your OpenRouter API key
export OPENROUTER_API_KEY=your-api-key

# Run the backend deployment script
./packages/cdk/scripts/deploy-backend.sh
```

### Deploy Frontend Only

```bash
# Set the API URL (obtained from backend deployment)
export API_URL=https://your-api-gateway-url

# Run the frontend deployment script
./packages/frontend/deploy.sh
```

### Deploy Both Backend and Frontend

```bash
# Set your OpenRouter API key
export OPENROUTER_API_KEY=your-api-key

# Run the all-in-one deployment script
./packages/cdk/scripts/deploy-all.sh
```

This script will:
1. Deploy the backend stack
2. Extract the API URL from the backend stack outputs
3. Deploy the frontend stack with the correct API URL
4. Output the URLs for both the backend API and frontend application

## Architecture

The application follows a serverless architecture:

- **Frontend**: React application hosted on S3 and served through CloudFront
- **Backend**: Express API running on AWS Lambda and API Gateway using serverless-http
- **Storage**: S3 buckets for static assets and article storage
- **Processing**: Lambda functions for article processing and sentiment analysis
- **Infrastructure**: Defined using AWS CDK for infrastructure as code

### Serverless Express Integration

The backend uses the `serverless-http` library to integrate Express with AWS Lambda:

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

This approach allows us to use the familiar Express framework while still benefiting from the serverless architecture of AWS Lambda.

## Features

- Dashboard to visualize sentiment trends for companies
- AI-powered sentiment analysis using LLMs
- Article submission through web UI or desktop CLI
- Real-time sentiment updates
- Topic-based sentiment breakdown
- Historical sentiment tracking

## License

This project is licensed under the MIT License - see the LICENSE file for details.