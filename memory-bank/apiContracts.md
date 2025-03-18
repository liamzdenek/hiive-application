# API Contracts: Hiive AI Market Sentiment Analyzer

This document defines all API contracts and data flows between components of the Hiive AI Market Sentiment Analyzer system.

## 1. Desktop Script API Contract

### Article Submission

The desktop script submits articles to the S3 storage using the AWS SDK.

**Command Structure:**
```bash
hiive-submit-article --file <path-to-article> --company <company-id> --source <source-name> [--tags <comma-separated-tags>]
```

**Request to S3:**
```typescript
interface ArticleSubmissionRequest {
  // AWS SDK S3 Upload Parameters
  Bucket: string;           // "hiive-articles"
  Key: string;              // Format: "articles/{companyId}/{timestamp}-{uuid}.json"
  Body: string;             // JSON stringified ArticleData
  ContentType: string;      // "application/json"
  Metadata: {
    companyId: string;      // Company identifier
    source: string;         // Source of the article (e.g., "news", "blog", "financial-report")
    submittedAt: string;    // ISO timestamp
    tags: string;           // Comma-separated tags (optional)
  }
}
```

**Article Data Structure:**
```typescript
interface ArticleData {
  companyId: string;        // Company identifier
  title: string;            // Article title
  content: string;          // Full article text content
  source: string;           // Source of the article
  publicationDate?: string; // ISO timestamp of publication (if available)
  url?: string;             // Original URL (if available)
  author?: string;          // Author name (if available)
  tags?: string[];          // Array of tags for categorization
  submittedAt: string;      // ISO timestamp of submission
}
```

## 2. S3 Storage Structure

### Buckets

The system uses two S3 buckets:

1. **hiive-frontend**: Stores static frontend assets
   - Path structure: Standard static website structure

2. **hiive-articles**: Stores submitted articles and analysis results
   - Path structure:
     - `articles/{companyId}/{timestamp}-{uuid}.json` - Raw submitted articles
     - `analysis/{companyId}/{timestamp}-{uuid}.json` - Analysis results
     - `summaries/{companyId}/latest.json` - Latest aggregated sentiment summary

### Object Structures

**Raw Article Object:**
```json
{
  "companyId": "company-123",
  "title": "Example Company Announces Q3 Results",
  "content": "Full text of the article...",
  "source": "financial-times",
  "publicationDate": "2025-03-15T10:30:00Z",
  "url": "https://example.com/article",
  "author": "Jane Smith",
  "tags": ["earnings", "financial-results", "tech-sector"],
  "submittedAt": "2025-03-18T13:45:22Z"
}
```

**Analysis Result Object:**
```json
{
  "articleId": "20250318-134522-abc123",
  "companyId": "company-123",
  "analysis": {
    "overallSentiment": 0.75,  // Range from -1 (negative) to 1 (positive)
    "confidence": 0.85,        // Range from 0 to 1
    "topics": [
      {
        "name": "revenue growth",
        "sentiment": 0.8,
        "relevance": 0.9
      },
      {
        "name": "market expansion",
        "sentiment": 0.6,
        "relevance": 0.7
      }
    ],
    "keyInsights": [
      "Company exceeded revenue expectations by 15%",
      "New product line showing strong initial adoption",
      "Expansion into European markets ahead of schedule"
    ],
    "riskFactors": [
      "Increasing competition in Asian markets",
      "Supply chain constraints mentioned as potential issue"
    ]
  },
  "metadata": {
    "processingTime": 1.2,     // Seconds
    "modelVersion": "gpt-4",
    "processedAt": "2025-03-18T13:46:30Z"
  },
  "originalArticle": {
    // Reference to original article or full content depending on requirements
    "reference": "articles/company-123/20250318-134522-abc123.json"
  }
}
```

**Sentiment Summary Object:**
```json
{
  "companyId": "company-123",
  "companyName": "Example Tech Inc.",
  "lastUpdated": "2025-03-18T14:00:00Z",
  "overallSentiment": {
    "score": 0.65,
    "trend": 0.05,         // Change from previous period
    "confidence": 0.82
  },
  "topicSentiments": [
    {
      "topic": "financial performance",
      "sentiment": 0.78,
      "volume": 12,        // Number of mentions
      "trend": 0.03
    },
    {
      "topic": "product innovation",
      "sentiment": 0.82,
      "volume": 8,
      "trend": 0.12
    },
    {
      "topic": "market competition",
      "sentiment": 0.45,
      "volume": 5,
      "trend": -0.08
    }
  ],
  "recentInsights": [
    "Strong revenue growth in enterprise segment",
    "New product launch received positive media coverage",
    "Analyst concerns about market saturation in core business"
  ],
  "sources": {
    "news": 15,
    "financial-reports": 3,
    "blogs": 7,
    "social-media": 25
  },
  "timeDistribution": {
    "last24h": 8,
    "last7d": 22,
    "last30d": 50
  }
}
```

## 3. Lambda Trigger Mechanisms

### Article Processor Lambda

**Trigger:** S3 Event Notification
- Event Type: `s3:ObjectCreated:*`
- Bucket: `hiive-articles`
- Prefix: `articles/`

**Event Structure:**
```json
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "2025-03-18T13:45:30Z",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "s3SchemaVersion": "1.0",
        "bucket": {
          "name": "hiive-articles",
          "arn": "arn:aws:s3:::hiive-articles"
        },
        "object": {
          "key": "articles/company-123/20250318-134522-abc123.json",
          "size": 2048,
          "eTag": "d41d8cd98f00b204e9800998ecf8427e"
        }
      }
    }
  ]
}
```

**Processing Flow:**
1. Lambda retrieves the article from S3
2. Processes the article using LangChain.js and LLM
3. Generates sentiment analysis and insights
4. Stores analysis result in S3 at `analysis/{companyId}/{timestamp}-{uuid}.json`
5. Updates the company's sentiment summary at `summaries/{companyId}/latest.json`

### Summary Aggregator Lambda

**Trigger:** CloudWatch Scheduled Event (Every 1 hour)

**Processing Flow:**
1. Lambda retrieves all new analysis results since last run
2. Aggregates sentiment data by company
3. Updates each company's sentiment summary
4. Stores updated summaries in S3

## 4. Backend API for Retrieving Stored Sentiments

### Get Company Sentiment

**Endpoint:** `GET /api/companies/{companyId}/sentiment`

**Response:**
```json
{
  "companyId": "company-123",
  "companyName": "Example Tech Inc.",
  "lastUpdated": "2025-03-18T14:00:00Z",
  "overallSentiment": {
    "score": 0.65,
    "trend": 0.05,
    "confidence": 0.82
  },
  "topicSentiments": [
    {
      "topic": "financial performance",
      "sentiment": 0.78,
      "volume": 12,
      "trend": 0.03
    },
    {
      "topic": "product innovation",
      "sentiment": 0.82,
      "volume": 8,
      "trend": 0.12
    }
  ],
  "recentInsights": [
    "Strong revenue growth in enterprise segment",
    "New product launch received positive media coverage"
  ],
  "sources": {
    "news": 15,
    "financial-reports": 3,
    "blogs": 7,
    "social-media": 25
  },
  "timeDistribution": {
    "last24h": 8,
    "last7d": 22,
    "last30d": 50
  }
}
```

### Get Company Sentiment History

**Endpoint:** `GET /api/companies/{companyId}/sentiment/history`

**Query Parameters:**
- `period`: string (daily, weekly, monthly) - Default: daily
- `from`: ISO date string - Default: 30 days ago
- `to`: ISO date string - Default: current date

**Response:**
```json
{
  "companyId": "company-123",
  "period": "daily",
  "data": [
    {
      "date": "2025-03-18",
      "sentiment": 0.65,
      "volume": 12
    },
    {
      "date": "2025-03-17",
      "sentiment": 0.62,
      "volume": 8
    },
    {
      "date": "2025-03-16",
      "sentiment": 0.58,
      "volume": 5
    }
  ]
}
```

### Get Company Articles

**Endpoint:** `GET /api/companies/{companyId}/articles`

**Query Parameters:**
- `limit`: number - Default: 10
- `offset`: number - Default: 0
- `source`: string - Filter by source
- `sentiment`: string (positive, negative, neutral) - Filter by sentiment

**Response:**
```json
{
  "companyId": "company-123",
  "total": 45,
  "articles": [
    {
      "id": "20250318-134522-abc123",
      "title": "Example Company Announces Q3 Results",
      "source": "financial-times",
      "publicationDate": "2025-03-15T10:30:00Z",
      "sentiment": 0.75,
      "url": "https://example.com/article",
      "keyInsights": [
        "Company exceeded revenue expectations by 15%",
        "New product line showing strong initial adoption"
      ]
    },
    {
      "id": "20250317-092033-def456",
      "title": "Analyst Perspective: Example Tech's Market Position",
      "source": "market-watch",
      "publicationDate": "2025-03-17T09:15:00Z",
      "sentiment": 0.62,
      "url": "https://example.com/another-article",
      "keyInsights": [
        "Strong competitive position in enterprise market",
        "Concerns about consumer segment growth"
      ]
    }
  ]
}
```

## 5. Frontend API for Storing Sentiment

The frontend doesn't directly store sentiment. Instead, it retrieves pre-processed sentiment data from the backend API. However, the frontend can trigger a refresh of sentiment analysis.

### Refresh Company Sentiment

**Endpoint:** `POST /api/companies/{companyId}/sentiment/refresh`

**Request:** Empty body

**Response:**
```json
{
  "status": "success",
  "message": "Sentiment refresh initiated",
  "estimatedCompletionTime": "30 seconds"
}
```

## 6. Frontend API for Submitting New Articles

### Submit Article via Frontend

**Endpoint:** `POST /api/articles`

**Request:**
```json
{
  "companyId": "company-123",
  "title": "Example Company Announces Q3 Results",
  "content": "Full text of the article...",
  "source": "financial-times",
  "publicationDate": "2025-03-15T10:30:00Z",
  "url": "https://example.com/article",
  "author": "Jane Smith",
  "tags": ["earnings", "financial-results", "tech-sector"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Article submitted successfully",
  "articleId": "20250318-134522-abc123",
  "estimatedProcessingTime": "45 seconds"
}
```

**Processing Flow:**
1. Frontend submits article to backend API
2. Backend validates the request
3. Backend uploads the article to S3 using the same format as the desktop script
4. S3 event triggers the Article Processor Lambda
5. Processing completes asynchronously

## 7. Internal Lambda Function Interfaces

### Article Processor Lambda

**Input:** S3 Event Notification (as shown above)

**Output:** None (writes directly to S3)

**Environment Variables:**
- `OPENAI_API_KEY`: Secret for OpenAI API access
- `ARTICLES_BUCKET`: S3 bucket name for articles
- `LOG_LEVEL`: Logging level

### Summary Aggregator Lambda

**Input:** CloudWatch Scheduled Event

**Output:** None (writes directly to S3)

**Environment Variables:**
- `ARTICLES_BUCKET`: S3 bucket name for articles
- `MAX_ARTICLES_PER_COMPANY`: Maximum number of articles to process per company
- `SUMMARY_TTL_DAYS`: Time to live for summary data
- `LOG_LEVEL`: Logging level

## 8. Error Handling

All APIs follow a consistent error response format:

```json
{
  "status": "error",
  "code": "RESOURCE_NOT_FOUND",
  "message": "Company with ID company-999 not found",
  "requestId": "req-abc-123"
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid request parameters
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server-side error
- `SERVICE_UNAVAILABLE`: Temporary service unavailability