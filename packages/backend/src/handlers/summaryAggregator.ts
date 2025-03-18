import { S3 } from 'aws-sdk';
import {
  ArticleAnalysis,
  SentimentSummary,
  formatSummaryKey,
  S3_BUCKETS,
  S3_FOLDERS
} from '@hiive/shared';

// Constants for summary aggregation
const MAX_INSIGHTS = 5;
const MAX_TOPICS = 5;
const RECENT_ANALYSIS_HOURS = 1; // Look back 1 hour for recent analyses

// Initialize AWS SDK
const s3 = new S3();

/**
 * Gets all analysis files for a company created since the last run
 * @param companyId The company ID
 * @param since ISO date string for the cutoff time
 * @returns Array of analysis objects
 */
async function getRecentAnalyses(companyId: string, since: string): Promise<ArticleAnalysis[]> {
  try {
    // List all analysis files for the company
    const listResponse = await s3.listObjectsV2({
      Bucket: S3_BUCKETS.ARTICLES,
      Prefix: `${S3_FOLDERS.ANALYSIS}/${companyId}/`
    }).promise();
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return [];
    }
    
    // Filter for files created after the cutoff time
    const recentKeys = listResponse.Contents
      .filter(item => item.LastModified && item.LastModified.toISOString() > since)
      .map(item => item.Key)
      .filter((key): key is string => !!key);
    
    if (recentKeys.length === 0) {
      return [];
    }
    
    // Get the content of each analysis file
    const analyses: ArticleAnalysis[] = [];
    
    for (const key of recentKeys) {
      try {
        const response = await s3.getObject({
          Bucket: S3_BUCKETS.ARTICLES,
          Key: key
        }).promise();
        
        if (response.Body) {
          const analysis = JSON.parse(response.Body.toString()) as ArticleAnalysis;
          analyses.push(analysis);
        }
      } catch (error) {
        console.error(`Error getting analysis from ${key}:`, error);
      }
    }
    
    return analyses;
  } catch (error) {
    console.error(`Error getting recent analyses for ${companyId}:`, error);
    return [];
  }
}

/**
 * Gets all company IDs that have analysis files
 * @returns Array of company IDs
 */
async function getAllCompanyIds(): Promise<string[]> {
  try {
    // List all folders under the analysis prefix
    const listResponse = await s3.listObjectsV2({
      Bucket: S3_BUCKETS.ARTICLES,
      Prefix: `${S3_FOLDERS.ANALYSIS}/`,
      Delimiter: '/'
    }).promise();
    
    if (!listResponse.CommonPrefixes || listResponse.CommonPrefixes.length === 0) {
      return [];
    }
    
    // Extract company IDs from the prefixes
    return listResponse.CommonPrefixes
      .map(prefix => {
        if (!prefix.Prefix) return null;
        const parts = prefix.Prefix.split('/');
        return parts.length >= 3 ? parts[1] : null;
      })
      .filter((id): id is string => !!id);
    
  } catch (error) {
    console.error('Error getting company IDs:', error);
    return [];
  }
}

/**
 * Updates the sentiment summary for a company
 * @param companyId The company ID
 * @param analyses Recent analyses to incorporate
 */
async function updateCompanySummary(companyId: string, analyses: ArticleAnalysis[]): Promise<void> {
  if (analyses.length === 0) {
    console.log(`No recent analyses for ${companyId}, skipping summary update`);
    return;
  }
  
  try {
    const summaryKey = formatSummaryKey(companyId);
    
    // Try to get existing summary
    let summary: SentimentSummary;
    
    try {
      const existingSummaryResponse = await s3.getObject({
        Bucket: S3_BUCKETS.ARTICLES,
        Key: summaryKey
      }).promise();
      
      if (existingSummaryResponse.Body) {
        summary = JSON.parse(existingSummaryResponse.Body.toString()) as SentimentSummary;
      } else {
        throw new Error('Empty summary body');
      }
    } catch (error) {
      // Create a new summary if one doesn't exist
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
          score: 0.5,
          trend: 0,
          confidence: 0.5
        },
        topicSentiments: [],
        recentInsights: [],
        sources: {},
        timeDistribution: {
          last24h: 0,
          last7d: 0,
          last30d: 0
        }
      };
    }
    
    // Update the summary with the new analyses
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Reset time distribution counters
    summary.timeDistribution.last24h = 0;
    summary.timeDistribution.last7d = 0;
    summary.timeDistribution.last30d = 0;
    
    // Aggregate sentiment data
    let totalSentiment = 0;
    let totalConfidence = 0;
    const topicMap = new Map<string, { sentiment: number, count: number, relevance: number }>();
    const insights: string[] = [];
    const riskFactors: string[] = [];
    const sourceCounts: Record<string, number> = {};
    
    for (const analysis of analyses) {
      // Add to overall sentiment
      totalSentiment += analysis.analysis.overallSentiment;
      totalConfidence += analysis.analysis.confidence;
      
      // Add to topic sentiments - normalize topic names to lowercase for better aggregation
      for (const topic of analysis.analysis.topics) {
        // Normalize topic name to lowercase and trim whitespace
        const normalizedName = topic.name.toLowerCase().trim();
        
        // Skip empty topics
        if (!normalizedName) continue;
        
        const existing = topicMap.get(normalizedName);
        if (existing) {
          // Weight by relevance when aggregating
          const totalRelevance = existing.relevance * existing.count + topic.relevance;
          const newCount = existing.count + 1;
          
          existing.sentiment = (existing.sentiment * existing.count + topic.sentiment) / newCount;
          existing.relevance = totalRelevance / newCount;
          existing.count += 1;
        } else {
          topicMap.set(normalizedName, {
            sentiment: topic.sentiment,
            relevance: topic.relevance,
            count: 1
          });
        }
      }
      
      // Add to insights and risk factors
      if (analysis.analysis.keyInsights && Array.isArray(analysis.analysis.keyInsights)) {
        insights.push(...analysis.analysis.keyInsights);
      }
      
      if (analysis.analysis.riskFactors && Array.isArray(analysis.analysis.riskFactors)) {
        riskFactors.push(...analysis.analysis.riskFactors);
      }
      
      // Add to source counts - extract source from reference path
      const pathParts = analysis.originalArticle.reference.split('/');
      // The source should be the first part after the folder name
      const source = pathParts.length > 1 ? pathParts[1] : 'unknown';
      // Ensure source is a string
      const sourceKey = source || 'unknown';
      sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0) + 1;
      
      // Update time distribution
      const processedAt = new Date(analysis.metadata.processedAt);
      if (processedAt >= oneDayAgo) {
        summary.timeDistribution.last24h += 1;
      }
      if (processedAt >= oneWeekAgo) {
        summary.timeDistribution.last7d += 1;
      }
      if (processedAt >= oneMonthAgo) {
        summary.timeDistribution.last30d += 1;
      }
    }
    
    // Update overall sentiment
    const oldSentiment = summary.overallSentiment.score;
    summary.overallSentiment.score = totalSentiment / analyses.length;
    summary.overallSentiment.trend = summary.overallSentiment.score - oldSentiment;
    summary.overallSentiment.confidence = totalConfidence / analyses.length;
    
    // Update topic sentiments
    summary.topicSentiments = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      sentiment: data.sentiment,
      volume: data.count,
      trend: 0 // We would need historical data to calculate this properly
    }));
    
    // Sort by volume (popularity) and take top MAX_TOPICS
    summary.topicSentiments.sort((a, b) => b.volume - a.volume);
    summary.topicSentiments = summary.topicSentiments.slice(0, MAX_TOPICS);
    
    // Update recent insights (deduplicate and take top MAX_INSIGHTS)
    // Filter out empty insights and trim whitespace
    const filteredInsights = insights
      .filter(insight => insight && insight.trim().length > 0)
      .map(insight => insight.trim());
    
    // Deduplicate insights
    const uniqueInsights = [...new Set(filteredInsights)];
    
    // Take top MAX_INSIGHTS
    summary.recentInsights = uniqueInsights.slice(0, MAX_INSIGHTS);
    
    // Update sources
    for (const [source, count] of Object.entries(sourceCounts)) {
      summary.sources[source] = (summary.sources[source] || 0) + count;
    }
    
    // Update last updated timestamp
    summary.lastUpdated = now.toISOString();
    
    // Save the updated summary
    await s3.putObject({
      Bucket: S3_BUCKETS.ARTICLES,
      Key: summaryKey,
      Body: JSON.stringify(summary, null, 2),
      ContentType: 'application/json'
    }).promise();
    
    console.log(`Updated summary for ${companyId} with ${analyses.length} new analyses`);
    
  } catch (error) {
    console.error(`Error updating summary for ${companyId}:`, error);
    throw error;
  }
}

/**
 * Lambda handler for aggregating sentiment summaries
 */
export const handler = async (): Promise<void> => {
  try {
    console.log('Starting summary aggregation');
    
    // Get all company IDs
    const companyIds = await getAllCompanyIds();
    
    if (companyIds.length === 0) {
      console.log('No companies found, nothing to aggregate');
      return;
    }
    
    console.log(`Found ${companyIds.length} companies to process`);
    
    // Calculate cutoff time based on RECENT_ANALYSIS_HOURS
    const cutoffTime = new Date(Date.now() - RECENT_ANALYSIS_HOURS * 60 * 60 * 1000).toISOString();
    
    // Process each company
    for (const companyId of companyIds) {
      try {
        // Get recent analyses
        const analyses = await getRecentAnalyses(companyId, cutoffTime);
        
        // Update the company summary
        await updateCompanySummary(companyId, analyses);
        
      } catch (error) {
        console.error(`Error processing company ${companyId}:`, error);
        // Continue with other companies
      }
    }
    
    console.log('Summary aggregation completed successfully');
    
  } catch (error) {
    console.error('Error in summary aggregation:', error);
    throw error;
  }
};