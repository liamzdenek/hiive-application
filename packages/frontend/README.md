# Hiive AI Market Sentiment Analyzer - Frontend

This is the frontend for the Hiive AI Market Sentiment Analyzer, a demo application that showcases how Agentic AI can enhance Hiive's private market data insights.

## Features

- Interactive dashboard for visualizing sentiment trends
- Company selector for viewing different companies
- Sentiment overview with key metrics
- Topic breakdown showing sentiment by topic
- Sentiment trend charts
- Key insights feed
- Recent articles with sentiment analysis

## Technology Stack

- React 18
- TypeScript
- Vite
- CSS Modules
- Recharts for data visualization
- React Query for data fetching

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

The application is configured to use environment variables for configuration. The API URL can be set using the `VITE_API_BASE_URL` environment variable.

```bash
# Start the development server with default configuration
npm run dev

# Start with a custom API URL
VITE_API_BASE_URL=http://your-api-url npm run dev

# Or use the provided script
./dev.sh
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Configuration

The application can be configured using environment variables:

- `VITE_API_BASE_URL`: The URL of the backend API
- `VITE_APP_VERSION`: The version of the application

These can be set in the following files:
- `.env`: Default configuration for development
- `.env.production`: Configuration for production builds

## Deployment

The application is deployed using AWS CDK. The frontend is built and deployed to an S3 bucket, with CloudFront for content delivery.

```bash
# Deploy using CDK
cd ../cdk
npm run deploy
```

## Project Structure

- `src/components/`: React components
- `src/context/`: React context for state management
- `src/services/`: API services
- `src/styles/`: CSS modules
- `src/config.ts`: Application configuration