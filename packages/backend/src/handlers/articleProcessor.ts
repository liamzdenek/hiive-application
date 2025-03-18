import { S3 } from 'aws-sdk';
import {
  ArticleData,
  ArticleAnalysis,
  formatAnalysisKey,
  formatSummaryKey,
  S3_FOLDERS
} from '@hiive/shared';

// Initialize AWS SDK
const s3 = new S3();

// Get the S3 bucket name from the environment variable
const ARTICLES_BUCKET = process.env.ARTICLES_BUCKET;
if (!ARTICLES_BUCKET) {
  console.warn('ARTICLES_BUCKET environment variable is not set. S3 operations will fail.');
  throw new Error('ARTICLES_BUCKET environment variable is required');
}
// Ensure TypeScript knows ARTICLES_BUCKET is not undefined
const BUCKET_NAME = ARTICLES_BUCKET as string;

/**
 * Analyzes the sentiment of an article using LLM
 * @param article The article data to analyze
 * @returns The sentiment analysis result
 */
async function analyzeSentiment(article: ArticleData): Promise<ArticleAnalysis['analysis']> {
  // In a real implementation, this would use LangChain.js and OpenRouter API
  // For now, we'll simulate the analysis with mock data
  
  console.log(`Analyzing sentiment for article: ${article.title}`);
  
  // Simulate processing time
  const startTime = Date.now();
  
  // For demo purposes, generate random sentiment based on keywords in the content
  let sentimentScore = 0.5; // Neutral by default
  
  // Simple keyword-based sentiment analysis for demo
  const positiveKeywords = ['growth', 'profit', 'success', 'innovation', 'launch', 'positive', 'increase'];
  const negativeKeywords = ['decline', 'loss', 'failure', 'risk', 'concern', 'negative', 'decrease'];
  
  // Count positive and negative keywords
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = article.content.match(regex);
    if (matches) {
      positiveCount += matches.length;
    }
  });
  
  negativeKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = article.content.match(regex);
    if (matches) {
      negativeCount += matches.length;
    }
  });
  
  // Calculate sentiment score (-1 to 1)
  const totalKeywords = positiveCount + negativeCount;
  if (totalKeywords > 0) {
    sentimentScore = (positiveCount - negativeCount) / totalKeywords;
    // Normalize to range between -1 and 1
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
    // Shift to range between 0 and 1 for the API contract
    sentimentScore = (sentimentScore + 1) / 2;
  }
  
  // Extract topics from content
  const topics = [
    {
      name: 'financial performance',
      sentiment: Math.random() * 0.4 + 0.4, // Random between 0.4 and 0.8
      relevance: Math.random() * 0.3 + 0.7  // Random between 0.7 and 1.0
    },
    {
      name: 'market competition',
      sentiment: Math.random() * 0.4 + 0.3, // Random between 0.3 and 0.7
      relevance: Math.random() * 0.3 + 0.6  // Random between 0.6 and 0.9
    },
    {
      name: 'product innovation',
      sentiment: Math.random() * 0.4 + 0.5, // Random between 0.5 and 0.9
      relevance: Math.random() * 0.3 + 0.5  // Random between 0.5 and 0.8
    }
  ];
  
  // Generate key insights
  const insights = [
    `Company reported ${positiveCount > negativeCount ? 'positive' : 'mixed'} results in recent quarter`,
    `New product line showing ${Math.random() > 0.5 ? 'strong' : 'moderate'} initial adoption`,
    `Expansion into new markets ${Math.random() > 0.7 ? 'ahead of' : 'on'} schedule`
  ];
  
  // Generate risk factors
  const risks = [
    `Increasing competition in ${Math.random() > 0.5 ? 'Asian' : 'European'} markets`,
    `Supply chain constraints mentioned as potential issue`,
    `Regulatory changes could impact ${Math.random() > 0.5 ? 'revenue' : 'operations'}`
  ];
  
  // Calculate processing time
  const processingTime = (Date.now() - startTime) / 1000;
  
  return {
    overallSentiment: sentimentScore,
    confidence: 0.75 + (Math.random() * 0.2), // Random between 0.75 and 0.95
    topics,
    keyInsights: insights,
    riskFactors: risks
  };
}

/**
 * Updates the company's sentiment summary with the new analysis
 * @param companyId The company ID
 * @param analysis The new analysis to incorporate
 */
async function updateCompanySummary(companyId: string, analysis: ArticleAnalysis): Promise<void> {
  const summaryKey = formatSummaryKey(companyId);
  
  try {
    // Try to get existing summary
    const existingSummaryResponse = await s3.getObject({
      Bucket: BUCKET_NAME,
      Key: summaryKey
    }).promise().catch(() => null);
    
    let summary;
    
    if (existingSummaryResponse && existingSummaryResponse.Body) {
      // Update existing summary
      summary = JSON.parse(existingSummaryResponse.Body.toString());
      
      // Update overall sentiment with weighted average
      const oldWeight = 0.7; // Give more weight to historical data
      const newWeight = 0.3; // Give less weight to new data
      
      summary.overallSentiment.score =
        (summary.overallSentiment.score * oldWeight) +
        (analysis.analysis.overallSentiment * newWeight);
      
      summary.overallSentiment.trend =
        analysis.analysis.overallSentiment - summary.overallSentiment.score;
      
      summary.overallSentiment.confidence =
        (summary.overallSentiment.confidence * oldWeight) +
        (analysis.analysis.confidence * newWeight);
      
      // Update last updated timestamp
      summary.lastUpdated = new Date().toISOString();
      
      // Add new insights
      summary.recentInsights = [
        ...analysis.analysis.keyInsights.slice(0, 1),
        ...summary.recentInsights.slice(0, 2)
      ];
      
      // Update source counts
      // Use the article source from the reference path
      const sourceParts = analysis.originalArticle.reference.split('/');
      const source = sourceParts.length > 1 ? sourceParts[0] : 'unknown';
      if (source) {
        summary.sources[source] = (summary.sources[source] || 0) + 1;
      }
      
      // Update time distribution
      summary.timeDistribution.last24h += 1;
      summary.timeDistribution.last7d += 1;
      summary.timeDistribution.last30d += 1;
      
    } else {
      // Create new summary
      const companyName = companyId === 'company-123'
        ? 'Example Tech Inc.'
        : companyId === 'company-456'
          ? 'Innovate AI Corp.'
          : companyId === 'company-789'
            ? 'Future Finance Ltd.'
            : `Company ${companyId}`;
      
      summary = {
        companyId,
        companyName,
        lastUpdated: new Date().toISOString(),
        overallSentiment: {
          score: analysis.analysis.overallSentiment,
          trend: 0,
          confidence: analysis.analysis.confidence
        },
        topicSentiments: analysis.analysis.topics.map(topic => ({
          topic: topic.name,
          sentiment: topic.sentiment,
          volume: 1,
          trend: 0
        })),
        recentInsights: analysis.analysis.keyInsights,
        sources: {
          // Use the article source from the reference path
          [analysis.originalArticle.reference.split('/')[0] || 'unknown']: 1
        },
        timeDistribution: {
          last24h: 1,
          last7d: 1,
          last30d: 1
        }
      };
    }
    
    // Save updated summary back to S3
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: summaryKey,
      Body: JSON.stringify(summary, null, 2),
      ContentType: 'application/json'
    }).promise();
    
    console.log(`Updated company summary for ${companyId}`);
    
  } catch (error) {
    console.error(`Error updating company summary for ${companyId}:`, error);
    throw error;
  }
}

/**
 * Lambda handler for processing articles uploaded to S3
 * @param event The S3 event notification
 */
export const handler = async (event: any): Promise<void> => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));
  
  // Process each record in the event
  for (const record of event.Records) {
    try {
      // Get the S3 bucket and key
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing article from ${bucket}/${key}`);
      
      // Get the article from S3
      const articleResponse = await s3.getObject({
        Bucket: bucket,
        Key: key
      }).promise();
      
      // Parse the article data
      const article: ArticleData = JSON.parse(articleResponse.Body!.toString());
      
      // Extract article ID from the key
      const keyParts = key.split('/');
      // Ensure we have a valid key part
      const lastKeyPart = keyParts.length > 0 ? keyParts[keyParts.length - 1] : '';
      // Ensure lastKeyPart is a string
      const filenameParts = (lastKeyPart || '').split('.');
      const articleId = filenameParts[0] || `article-${Date.now()}`;
      
      // Analyze the sentiment
      console.log(`Analyzing sentiment for article: ${article.title}`);
      const startTime = Date.now();
      const analysisResult = await analyzeSentiment(article);
      // Calculate processing time for logging
      const processingTimeMs = Date.now() - startTime;
      console.log(`Sentiment analysis completed in ${processingTimeMs}ms`);
      
      // Create the analysis object
      const analysis: ArticleAnalysis = {
        articleId,
        companyId: article.companyId,
        analysis: analysisResult,
        metadata: {
          processingTime: processingTimeMs / 1000, // Convert to seconds
          modelVersion: 'openrouter-anthropic-claude-3-opus',
          processedAt: new Date().toISOString()
        },
        originalArticle: {
          reference: key
        }
      };
      
      // Store the analysis in S3
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] || '';
      const idParts = articleId.split('-');
      const idSuffix = idParts.length > 1 ? idParts[1] : articleId;
      // Ensure all parameters are strings
      const analysisKey = formatAnalysisKey(
        article.companyId,
        timestamp,
        idSuffix || articleId // Fallback to articleId if idSuffix is undefined
      );
      
      await s3.putObject({
        Bucket: bucket,
        Key: analysisKey,
        Body: JSON.stringify(analysis, null, 2),
        ContentType: 'application/json'
      }).promise();
      
      console.log(`Stored analysis at ${bucket}/${analysisKey}`);
      
      // Update the company's sentiment summary
      await updateCompanySummary(article.companyId, analysis);
      
      console.log(`Successfully processed article: ${article.title}`);
      
    } catch (error) {
      console.error('Error processing article:', error);
      // In a production environment, we might want to send this to a DLQ
      // or retry with exponential backoff
    }
  }
};