import express from 'express';
import { S3 } from 'aws-sdk';
import {
  createSuccessResponse,
  createErrorResponse,
  ArticleData,
  formatArticleKey,
  generateId,
  S3_FOLDERS,
  ERROR_CODES
} from '@hiive/shared';

const app = express();
const port = process.env.PORT || 3001;
const s3 = new S3();

// Get the S3 bucket name from the environment variable
const ARTICLES_BUCKET = process.env.ARTICLES_BUCKET;
if (!ARTICLES_BUCKET) {
  console.warn('ARTICLES_BUCKET environment variable is not set. S3 operations will fail.');
  throw new Error('ARTICLES_BUCKET environment variable is required');
}
// Ensure TypeScript knows ARTICLES_BUCKET is not undefined
const BUCKET_NAME = ARTICLES_BUCKET as string;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
  return; // Explicitly return to satisfy TypeScript
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json(createErrorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    'An internal server error occurred',
    req.headers['x-request-id'] as string
  ));
});

// Routes
app.get('/api/health', (_, res) => {
  res.json(createSuccessResponse({ status: 'ok' }));
});

// Get company sentiment
app.get('/api/companies/:companyId/sentiment', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get the sentiment summary from S3
    const summaryKey = `summaries/${companyId}/latest.json`;
    
    try {
      const summaryResponse = await s3.getObject({
        Bucket: BUCKET_NAME,
        Key: summaryKey
      }).promise();
      
      if (summaryResponse.Body) {
        const summary = JSON.parse(summaryResponse.Body.toString());
        res.json(createSuccessResponse(summary));
      } else {
        throw new Error('Empty summary body');
      }
    } catch (error) {
      // If the summary doesn't exist, return a default one
      const defaultSummary = {
        companyId,
        companyName: companyId === 'company-123'
          ? 'Example Tech Inc.'
          : companyId === 'company-456'
            ? 'Innovate AI Corp.'
            : companyId === 'company-789'
              ? 'Future Finance Ltd.'
              : `Company ${companyId}`,
        lastUpdated: new Date().toISOString(),
        overallSentiment: {
          score: 0.5,
          trend: 0,
          confidence: 0.5
        },
        topicSentiments: [],
        recentInsights: [
          "No sentiment data available yet",
          "Submit articles to generate insights"
        ],
        sources: {},
        timeDistribution: {
          last24h: 0,
          last7d: 0,
          last30d: 0
        }
      };
      
      res.json(createSuccessResponse(defaultSummary));
    }
  } catch (error) {
    console.error('Error getting company sentiment:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Error retrieving company sentiment',
      req.headers['x-request-id'] as string
    ));
  }
});

// Get company sentiment history
app.get('/api/companies/:companyId/sentiment/history', async (req, res) => {
  try {
    const { companyId } = req.params;
    const period = (req.query.period as string) || 'daily';
    const from = (req.query.from as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const to = (req.query.to as string) || new Date().toISOString();
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // List analysis files for the company
    const listResponse = await s3.listObjectsV2({
      Bucket: BUCKET_NAME,
      Prefix: `${S3_FOLDERS.ANALYSIS}/${companyId}/`
    }).promise();
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return res.json(createSuccessResponse({
        companyId,
        period,
        data: []
      }));
    }
    
    // Get all analysis files
    const analyses = [];
    for (const item of listResponse.Contents) {
      if (!item.Key) continue;
      
      try {
        const response = await s3.getObject({
          Bucket: BUCKET_NAME,
          Key: item.Key
        }).promise();
        
        if (response.Body) {
          const analysis = JSON.parse(response.Body.toString());
          
          // Check if the analysis is within the date range
          const processedAt = new Date(analysis.metadata.processedAt);
          if (processedAt >= fromDate && processedAt <= toDate) {
            analyses.push(analysis);
          }
        }
      } catch (error) {
        console.error(`Error getting analysis from ${item.Key}:`, error);
      }
    }
    
    // Group analyses by date based on the period
    const dateMap = new Map();
    
    for (const analysis of analyses) {
      const processedAt = new Date(analysis.metadata.processedAt);
      let dateKey;
      
      if (period === 'daily') {
        dateKey = processedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        // Get the Monday of the week
        const day = processedAt.getDay();
        const diff = processedAt.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        const monday = new Date(processedAt);
        monday.setDate(diff);
        dateKey = monday.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        dateKey = `${processedAt.getFullYear()}-${String(processedAt.getMonth() + 1).padStart(2, '0')}`;
      } else {
        dateKey = processedAt.toISOString().split('T')[0]; // Default to daily
      }
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          sentimentSum: 0,
          count: 0
        });
      }
      
      const dateData = dateMap.get(dateKey);
      dateData.sentimentSum += analysis.analysis.overallSentiment;
      dateData.count += 1;
    }
    
    // Convert the map to an array of data points
    const data = Array.from(dateMap.entries()).map(([date, values]) => ({
      date,
      sentiment: values.count > 0 ? values.sentimentSum / values.count : 0,
      volume: values.count
    }));
    
    // Sort by date
    data.sort((a, b) => a.date.localeCompare(b.date));
    
    res.json(createSuccessResponse({
      companyId,
      period,
      data
    }));
  } catch (error) {
    console.error('Error getting sentiment history:', error);
    res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Error retrieving sentiment history',
      req.headers['x-request-id'] as string
    ));
  }
});

// Get company articles
app.get('/api/companies/:companyId/articles', async (req, res) => {
  try {
    const { companyId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // List analysis files for the company
    const listResponse = await s3.listObjectsV2({
      Bucket: BUCKET_NAME,
      Prefix: `analysis/${companyId}/`
    }).promise();
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return res.json(createSuccessResponse({
        companyId,
        total: 0,
        articles: []
      }));
    }
    
    // Sort by last modified (newest first)
    const sortedKeys = listResponse.Contents
      .filter(item => item.Key)
      .sort((a, b) => {
        if (!a.LastModified || !b.LastModified) return 0;
        return b.LastModified.getTime() - a.LastModified.getTime();
      })
      .map(item => item.Key as string);
    
    // Apply pagination
    const paginatedKeys = sortedKeys.slice(offset, offset + limit);
    
    // Get the content of each analysis file
    const articles = [];
    
    for (const key of paginatedKeys) {
      try {
        const response = await s3.getObject({
          Bucket: BUCKET_NAME,
          Key: key
        }).promise();
        
        if (response.Body) {
          const analysis = JSON.parse(response.Body.toString());
          
          // Get the original article
          const articleResponse = await s3.getObject({
            Bucket: BUCKET_NAME,
            Key: analysis.originalArticle.reference
          }).promise().catch(() => null);
          
          let title = 'Unknown Title';
          let source = 'unknown';
          let publicationDate = null;
          let url = null;
          
          if (articleResponse && articleResponse.Body) {
            const article = JSON.parse(articleResponse.Body.toString());
            title = article.title;
            source = article.source;
            publicationDate = article.publicationDate;
            url = article.url;
          }
          
          articles.push({
            id: analysis.articleId,
            title,
            source,
            publicationDate: publicationDate || analysis.metadata.processedAt,
            sentiment: analysis.analysis.overallSentiment,
            url,
            keyInsights: analysis.analysis.keyInsights
          });
        }
      } catch (error) {
        console.error(`Error getting analysis from ${key}:`, error);
      }
    }
    
    return res.json(createSuccessResponse({
      companyId,
      total: sortedKeys.length,
      articles
    }));
  } catch (error) {
    console.error('Error getting company articles:', error);
    return res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Error retrieving company articles',
      req.headers['x-request-id'] as string
    ));
  }
});

// Submit article
app.post('/api/articles', async (req, res) => {
  try {
    const articleData: ArticleData = req.body;
    
    // Validate required fields
    if (!articleData.companyId || !articleData.title || !articleData.content || !articleData.source) {
      return res.status(400).json(createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Missing required fields: companyId, title, content, source',
        req.headers['x-request-id'] as string
      ));
    }
    
    // Add submission timestamp if not provided
    if (!articleData.submittedAt) {
      articleData.submittedAt = new Date().toISOString();
    }
    
    // Generate S3 key
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] || '';
    const uuid = generateId();
    // Ensure companyId is a string
    const companyId = String(articleData.companyId);
    const key = formatArticleKey(companyId, timestamp, uuid);
    
    // Upload to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(articleData),
      ContentType: 'application/json',
      Metadata: {
        companyId: articleData.companyId,
        source: articleData.source,
        submittedAt: articleData.submittedAt,
        tags: articleData.tags ? articleData.tags.join(',') : ''
      }
    }).promise();
    
    // Return success response
    return res.status(201).json(createSuccessResponse({
      status: 'success',
      message: 'Article submitted successfully',
      articleId: `${timestamp}-${uuid}`,
      estimatedProcessingTime: '45 seconds'
    }));
  } catch (error) {
    console.error('Error submitting article:', error);
    return res.status(500).json(createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      'Error submitting article',
      req.headers['x-request-id'] as string
    ));
  }
});

// Refresh company sentiment
app.post('/api/companies/:companyId/sentiment/refresh', (req, res) => {
  // Get companyId from params but we're not using it in this demo implementation
  // const { companyId } = req.params;
  
  // In a real implementation, this would trigger a Lambda function to refresh the sentiment
  // For now, just return a success response
  return res.json(createSuccessResponse({
    status: 'success',
    message: 'Sentiment refresh initiated',
    estimatedCompletionTime: '30 seconds'
  }));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;