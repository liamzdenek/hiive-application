// Article related types
export interface ArticleData {
  companyId: string;
  title: string;
  content: string;
  source: string;
  publicationDate?: string;
  url?: string;
  author?: string;
  tags?: string[];
  submittedAt: string;
}

export interface ArticleAnalysis {
  articleId: string;
  companyId: string;
  analysis: {
    overallSentiment: number;
    confidence: number;
    topics: Array<{
      name: string;
      sentiment: number;
      relevance: number;
    }>;
    keyInsights: string[];
    riskFactors: string[];
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    processedAt: string;
  };
  originalArticle: {
    reference: string;
  };
}

export interface SentimentSummary {
  companyId: string;
  companyName: string;
  lastUpdated: string;
  overallSentiment: {
    score: number;
    trend: number;
    confidence: number;
  };
  topicSentiments: Array<{
    topic: string;
    sentiment: number;
    volume: number;
    trend: number;
  }>;
  recentInsights: string[];
  sources: {
    [key: string]: number;
  };
  timeDistribution: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

// API response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  code?: string;
  message?: string;
  requestId?: string | undefined;
}

// Export all types