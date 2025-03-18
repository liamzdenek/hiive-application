# Tech Context: Hiive AI Market Sentiment Analyzer

## Technologies Used

### Frontend
- **React 18**: Modern UI library for building component-based interfaces
- **TypeScript 5.x**: Strongly-typed JavaScript for improved developer experience
- **Vite**: Fast build tool for modern web development
- **Tailwind CSS 3.x**: Utility-first CSS framework for rapid styling
- **Recharts 2.x**: Composable charting library built on React components
- **React Query**: Data fetching and caching library

### Backend
- **Node.js 20.x**: JavaScript runtime for server-side code
- **Express 4.x**: Minimal web framework for Node.js
- **TypeScript 5.x**: Type safety for backend code
- **Zod**: TypeScript-first schema validation
- **Commander.js**: Complete solution for Node.js command-line interfaces

### AI & Data Processing
- **LangChain.js**: Framework for developing applications powered by language models
- **OpenRouter API**: Flexible access to various LLM models
- **Cheerio**: Server-side HTML parsing for web scraping
- **node-cache**: In-memory caching for API responses
### Infrastructure & Deployment
- **AWS CDK**: Infrastructure as Code for AWS resources
- **AWS Lambda**: Serverless compute for backend API and article processing
- **Amazon API Gateway**: API management and routing
- **Amazon S3**: Static website hosting for frontend and scale-to-zero article storage
- **Amazon CloudFront**: Content delivery network
- **Amazon CloudWatch**: Logging, monitoring, and scheduled events
- **AWS SDK for JavaScript**: Programmatic access to AWS services from Node.js
- **S3 Event Notifications**: Trigger Lambda functions when new articles are uploaded
- **Lambda Environment Variables**: Secure storage for configuration and API keys

### Development Tools
- **Vite**: Fast build tooling for modern web projects
- **ESLint**: Static code analysis for identifying problematic patterns
- **Prettier**: Code formatter for consistent style
- **Vitest**: Unit testing framework compatible with Vite
- **MSW (Mock Service Worker)**: API mocking for development and testing

## Development Setup
### Local Development Environment
- Node.js 20.x LTS
- npm or yarn for package management
- Git for version control
- AWS CLI configured with appropriate credentials and profiles
- AWS CDK CLI installed globally
- VSCode with recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin
  - AWS Toolkit
  - Thunder Client (for API testing)
  - AWS Toolkit

### Project Structure
```
hiive-sentiment-analyzer/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── cdk/
│   ├── bin/
│   │   └── app.ts
│   ├── lib/
│   │   ├── frontend-stack.ts
│   │   ├── backend-stack.ts
│   │   └── pipeline-stack.ts
│   ├── cdk.json
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── common/
│       │   ├── dashboard/
│       │   ├── layout/
│       │   └── charts/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       │   ├── api/
│       │   └── agents/
│       ├── types/
│       ├── utils/
│       └── styles/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── handlers/
│   │   ├── agents/
│   │   ├── middleware/
│   │   └── utils/
│   └── tests/
├── desktop/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── commands/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
└── shared/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── types/
        └── constants/
```

### Configuration
- Environment variables for local development
- AWS CDK configuration for infrastructure
- TypeScript configuration for frontend and backend
- ESLint and Prettier configuration for code quality
- AWS Systems Manager Parameter Store for production configuration

## Technical Constraints

### Time Constraints
- 1-2 day implementation window requires focused scope
- Prioritize core functionality over extensive features
- Use existing libraries and tools to accelerate development
- Implement mock data where appropriate to demonstrate UI without full backend

### Performance Considerations
- LLM API calls can be slow and expensive
  - Implement caching for repeated queries
  - Use streaming responses where appropriate
  - Consider batching requests when possible
- Client-side performance
  - Optimize bundle size with code splitting
  - Implement virtualization for long lists
  - Use memoization for expensive calculations

### Security Considerations
- API keys must be secured and not exposed to the client
  - Store in AWS Systems Manager Parameter Store
  - Access securely from Lambda functions
- Implement rate limiting for API endpoints
- Sanitize user inputs to prevent injection attacks
- Use HTTPS for all API communications
- Configure appropriate IAM roles and permissions

### Scalability Limitations
- Demo implementation may not scale to production workloads
- In-memory caching suitable for demo but not production
- Mock data may be used where real-time API integration is impractical

## Dependencies

### External APIs
- **OpenRouter API**: For flexible access to various LLM models
- **News APIs**: (e.g., NewsAPI, GDELT) for retrieving company news
- **Social Media APIs**: For retrieving social sentiment (may be mocked)
- **Financial Data APIs**: For retrieving financial metrics (may be mocked)
- **AWS S3 API**: For storing and retrieving articles
- **AWS CloudWatch API**: For logging and monitoring
- **AWS API Gateway**: For exposing REST API endpoints

### Third-Party Libraries
- **LangChain.js**: For building AI agent workflows
- **Recharts**: For data visualization
- **TailwindCSS**: For styling
- **React Query**: For data fetching and caching
- **date-fns**: For date manipulation
- **zod**: For schema validation
- **aws-cdk-lib**: For defining AWS infrastructure
- **aws-sdk**: For interacting with AWS services
- **commander.js**: For building command-line interfaces
- **express**: For building REST APIs
- **serverless-http**: For adapting Express apps to Lambda
- **aws-lambda**: For Lambda function types and utilities

### Development Dependencies
- **TypeScript**: For type checking
- **ESLint**: For code linting
- **Prettier**: For code formatting
- **Vitest**: For unit testing
- **MSW**: For API mocking

## Integration Points

### Potential Hiive Platform Integration
- **Authentication**: Could integrate with Hiive's existing auth system
- **Company Data**: Could pull from Hiive's company database
- **UI/UX**: Designed to match Hiive's existing design system
- **API Structure**: Follows RESTful or GraphQL patterns compatible with Hiive's backend

### External System Integration
- **News Sources**: Integration with financial news APIs
- **Social Media**: Integration with social listening platforms
- **Financial Data**: Integration with financial data providers
- **LLM Providers**: Integration with OpenAI or other LLM providers

## Deployment Strategy

### AWS CDK Deployment
- **Infrastructure as Code**: Define all AWS resources using TypeScript
- **AWS Profile Configuration**: Use specific AWS profiles for deployment
- **Frontend Hosting**: S3 + CloudFront for static website hosting
- **Backend Services**: Lambda functions for API endpoints and article processing
- **API Management**: API Gateway for routing and management
- **Configuration Management**: Environment variables for API keys and configuration
- **Monitoring**: CloudWatch for logs and metrics
- **Event-Driven Architecture**: S3 event notifications for triggering Lambda functions
- **Deployment Scripts**: Shell scripts for building and deploying the application

### Deployment Considerations
- **API Rate Limits**: Ensure external API usage stays within free tier limits
- **Cold Starts**: Minimize impact of Lambda function cold starts
- **Error Handling**: Implement robust error handling for production environment
- **Cost Management**: Utilize AWS Free Tier where possible
- **Security**: Configure appropriate IAM roles and permissions