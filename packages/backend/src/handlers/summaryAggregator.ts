import { S3 } from 'aws-sdk';
import { 
  ArticleAnalysis, 
  SentimentSummary,
  formatSummaryKey,
  S3_BUCKETS,
  S3_FOLDERS
} from '@hiive/shared';

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
    const sourceCounts: Record<string, number> = {};
    
    for (const analysis of analyses) {
      // Add to overall sentiment
      totalSentiment += analysis.analysis.overallSentiment;
      totalConfidence += analysis.analysis.confidence;
      
      // Add to topic sentiments
      for (const topic of analysis.analysis.topics) {
        const existing = topicMap.get(topic.name);
        if (existing) {
          existing.sentiment = (existing.sentiment * existing.count + topic.sentiment) / (existing.count + 1);
          existing.relevance = (existing.relevance * existing.count + topic.relevance) / (existing.count + 1);
          existing.count += 1;
        } else {
          topicMap.set(topic.name, {
            sentiment: topic.sentiment,
            relevance: topic.relevance,
            count: 1
          });
        }
      }
      
      // Add to insights
      insights.push(...analysis.analysis.keyInsights);
      
      // Add to source counts
      const source = analysis.originalArticle.reference.split('/')[0] || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      
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
    
    // Sort by relevance and take top 5
    summary.topicSentiments.sort((a, b) => b.volume - a.volume);
    summary.topicSentiments = summary.topicSentiments.slice(0, 5);
    
    // Update recent insights (deduplicate and take top 5)
    const uniqueInsights = [...new Set(insights)];
    summary.recentInsights = uniqueInsights.slice(0, 5);
    
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
    
    // Calculate cutoff time (1 hour ago)
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
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