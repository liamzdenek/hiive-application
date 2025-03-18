// API endpoints
export const API_ENDPOINTS = {
  COMPANIES: '/api/companies',
  ARTICLES: '/api/articles',
};

// Sentiment values
export const SENTIMENT = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
};

// Time periods
export const TIME_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

// S3 bucket names
export const S3_BUCKETS = {
  FRONTEND: 'hiive-frontend',
  ARTICLES: 'hiive-articles',
};

// S3 folder structure
export const S3_FOLDERS = {
  ARTICLES: 'articles',
  ANALYSIS: 'analysis',
  SUMMARIES: 'summaries',
};