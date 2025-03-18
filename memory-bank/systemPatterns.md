# System Patterns: Hiive AI Market Sentiment Analyzer

## System Architecture

The Hiive AI Market Sentiment Analyzer follows a modern, serverless architecture designed to showcase best practices while remaining implementable within a 1-2 day timeframe and deployable using AWS CDK.

```mermaid
flowchart TD
    subgraph Frontend
        UI[React UI Components]
        State[State Management]
        API[API Client]
    end
    
    subgraph Desktop
        Script[Desktop Script]
    end
    
    subgraph AWS_Cloud
        subgraph CloudFront
            CDN[Content Delivery Network]
        end
        
        subgraph S3
            StaticAssets[Static Assets]
            ArticleStorage[Article Storage]
        end
        
        subgraph API_Gateway
            APIRoutes[API Routes]
        end
        
        subgraph Lambda
            AgentOrchestrator[Agent Orchestrator]
            NewsHandler[News Analysis Handler]
            SocialHandler[Social Media Handler]
            FinanceHandler[Financial Reports Handler]
            SynthesisHandler[Insight Synthesis Handler]
            ArticleProcessor[Article Processor]
        end
        
        subgraph Parameter_Store
            Secrets[API Keys & Configuration]
        end
        
        subgraph CloudWatch
            Logs[Application Logs]
            Metrics[Performance Metrics]
        end
    end
    
    subgraph External_Services
        NewsAPI[News APIs]
        SocialAPI[Social Media APIs]
        LLMAPI[LLM API]
    end
    
    UI <--> State
    State <--> API
    API <--> CloudFront
    CloudFront <--> StaticAssets
    CloudFront <--> APIRoutes
    
    Script --> ArticleStorage
    ArticleStorage --> ArticleProcessor
    
    APIRoutes <--> AgentOrchestrator
    AgentOrchestrator <--> NewsHandler
    AgentOrchestrator <--> SocialHandler
    AgentOrchestrator <--> FinanceHandler
    AgentOrchestrator <--> SynthesisHandler
    AgentOrchestrator <--> ArticleProcessor
    
    NewsHandler <--> LLMAPI
    SocialHandler <--> LLMAPI
    FinanceHandler <--> LLMAPI
    SynthesisHandler <--> LLMAPI
    ArticleProcessor <--> LLMAPI
    
    NewsHandler <--> NewsAPI
    SocialHandler <--> SocialAPI
    Lambda <--> Secrets
    Lambda --> Logs
    Lambda --> Metrics
```

## Key Technical Decisions

1. **Frontend Framework**: React with TypeScript and Vite
   - Aligns with Hiive's tech stack preferences
   - Provides type safety and better developer experience
   - Enables rapid development with component reusability
   - Vite offers fast build times and modern development experience

2. **Backend Implementation**: AWS Lambda with Express
   - Serverless functions that scale automatically
   - Express adapter for familiar API development
   - Cost-effective for demo applications
   - Easily deployable with AWS CDK

3. **State Management**: React Context + Hooks
   - Lightweight solution appropriate for demo scope
   - Avoids overhead of Redux for a smaller application
   - Maintains clean component architecture

4. **Styling Approach**: Tailwind CSS
   - Enables rapid UI development
   - Provides consistent design system
   - Aligns with modern frontend practices

5. **AI Integration**: LangChain.js
   - Provides tools for building AI agent workflows
   - Simplifies integration with LLM APIs
   - Enables complex agent interactions

6. **Data Visualization**: Recharts
   - React-native charting library
   - Customizable and responsive
   - Lightweight with good performance

7. **Infrastructure as Code**: AWS CDK
   - Define infrastructure using TypeScript
   - Consistent language across application and infrastructure
   - Enables infrastructure testing and validation
   - Provides repeatable deployments

8. **Desktop Script**: Node.js CLI Application
   - Enables article submission from desktop environment
   - Provides simple interface for users to submit articles
   - Integrates with S3 for storage

9. **Storage Solution**: Amazon S3
   - Cost-effective, scale-to-zero storage for articles
   - Pay only for what you use with no minimum fees
   - Integrates seamlessly with Lambda for processing
   - Supports lifecycle policies for automatic cleanup

## Design Patterns in Use

### Frontend Patterns

1. **Component Composition**
   - Build complex UI from simple, reusable components
   - Maintain clear separation of concerns
   - Enable consistent styling and behavior

2. **Custom Hooks**
   - Encapsulate and reuse stateful logic
   - Separate data fetching from presentation
   - Improve testability

3. **Container/Presentational Pattern**
   - Separate data management from rendering
   - Improve component reusability
   - Simplify testing

### Backend Patterns

1. **Serverless Architecture**
   - Implement backend logic in Lambda functions
   - Scale automatically based on demand
   - Reduce operational complexity

2. **Agent-Based Architecture**
   - Delegate specific tasks to specialized AI agents
   - Enable parallel processing of different data sources
   - Maintain separation of concerns

3. **Orchestrator Pattern**
   - Coordinate multiple agents
   - Manage workflow and dependencies
   - Handle error cases and retries

4. **Caching Strategy**
   - Cache expensive AI operations
   - Improve response times for repeated queries
   - Reduce API costs

5. **Event-Driven Processing**
   - Process articles asynchronously as they arrive in S3
   - Decouple submission from processing
   - Enable scalable, resilient workflow

### AI Agent Patterns

1. **Chain of Thought Prompting**
   - Guide LLMs through complex reasoning tasks
   - Improve accuracy of sentiment analysis
   - Enable transparent decision-making

2. **Retrieval-Augmented Generation (RAG)**
   - Enhance LLM responses with retrieved context
   - Provide up-to-date information about companies
   - Reduce hallucinations

3. **Agent Specialization**
   - Create purpose-built agents for specific tasks
   - Optimize prompts for different data sources
   - Enable parallel processing

### Infrastructure Patterns

1. **Infrastructure as Code**
   - Define all infrastructure components in TypeScript using AWS CDK
   - Enable version control of infrastructure
   - Facilitate reproducible deployments

2. **Immutable Infrastructure**
   - Create new resources rather than modifying existing ones
   - Improve reliability and consistency
   - Enable rollback to previous states

3. **Least Privilege Access**
   - Grant minimal permissions required for each component
   - Improve security posture
   - Follow AWS security best practices

4. **Configuration Externalization**
   - Store configuration in Parameter Store
   - Separate configuration from code
   - Enable environment-specific settings

## Component Relationships

### Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Desktop as Desktop Script
    participant S3 as S3 Storage
    participant API as API Client
    participant CloudFront as CloudFront
    participant APIGateway as API Gateway
    participant Lambda as Lambda Functions
    participant Agents as AI Agents
    participant LLM as LLM API
    
    alt Web UI Flow
        User->>UI: Select company
        UI->>API: Request sentiment analysis
        API->>CloudFront: Send API request
        CloudFront->>APIGateway: Route to API Gateway
        APIGateway->>Lambda: Invoke Lambda function
        
        alt Cache Hit
            Lambda->>UI: Return cached results
        else Cache Miss
            Lambda->>Agents: Dispatch tasks
            Agents->>LLM: Process with LLM
            LLM->>Agents: Return analysis
            Agents->>Lambda: Return results
            Lambda->>UI: Return analysis results
        end
        
        UI->>User: Display sentiment dashboard
    end
    
    alt Desktop Script Flow
        User->>Desktop: Submit article
        Desktop->>S3: Upload article
        S3->>Lambda: Trigger article processor
        Lambda->>Agents: Process article
        Agents->>LLM: Analyze with LLM
        LLM->>Agents: Return sentiment analysis
        Agents->>Lambda: Return results
        Lambda->>S3: Store analysis results
    end
```

### Component Hierarchy

```mermaid
flowchart TD
    App --> Layout
    Layout --> Header
    Layout --> Dashboard
    Layout --> Footer
    
    Dashboard --> CompanySelector
    Dashboard --> SentimentOverview
    Dashboard --> DetailedAnalysis
    Dashboard --> InsightsFeed
    
    SentimentOverview --> SentimentChart
    SentimentOverview --> SentimentScore
    
    DetailedAnalysis --> TopicBreakdown
    DetailedAnalysis --> SourceAnalysis
    DetailedAnalysis --> TrendAnalysis
    
    InsightsFeed --> InsightCard
```

## AWS CDK Infrastructure

```mermaid
flowchart TD
    subgraph CDK_App
        App[CDK App]
    end
    
    subgraph Stacks
        FrontendStack[Frontend Stack]
        BackendStack[Backend Stack]
        PipelineStack[Pipeline Stack]
    end
    
    subgraph Frontend_Resources
        S3Bucket[S3 Bucket]
        CloudFrontDist[CloudFront Distribution]
        OriginAccessIdentity[Origin Access Identity]
    end
    
    subgraph Backend_Resources
        ApiGateway[API Gateway]
        LambdaFunctions[Lambda Functions]
        ArticleStorageBucket[S3 Article Storage]
        ParameterStore[Parameter Store]
        LogGroups[CloudWatch Log Groups]
    end
    
    subgraph Pipeline_Resources
        CodePipeline[CodePipeline]
        CodeBuild[CodeBuild]
        ArtifactBucket[Artifact Bucket]
    end
    
    App --> FrontendStack
    App --> BackendStack
    App --> PipelineStack
    
    FrontendStack --> S3Bucket
    FrontendStack --> CloudFrontDist
    FrontendStack --> OriginAccessIdentity
    
    BackendStack --> ApiGateway
    BackendStack --> LambdaFunctions
    BackendStack --> ParameterStore
    BackendStack --> LogGroups
    
    PipelineStack --> CodePipeline
    PipelineStack --> CodeBuild
    PipelineStack --> ArtifactBucket
```

This architecture balances sophistication with practicality, enabling a compelling demonstration of AI capabilities while remaining feasible to implement within the 1-2 day timeframe and deployable using AWS CDK.