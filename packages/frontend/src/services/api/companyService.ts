import { API_ENDPOINTS } from '@hiive/shared';
import { apiClient } from './apiClient';
import { SentimentSummary } from '@hiive/shared';

/**
 * Service for company-related API requests
 */
export const companyService = {
  /**
   * Get sentiment data for a company
   * @param companyId - ID of the company
   * @returns Promise with the sentiment data
   */
  async getCompanySentiment(companyId: string) {
    return apiClient.get<SentimentSummary>(
      `${API_ENDPOINTS.COMPANIES}/${companyId}/sentiment`
    );
  },

  /**
   * Get sentiment history for a company
   * @param companyId - ID of the company
   * @param period - Time period (daily, weekly, monthly)
   * @param from - Start date
   * @param to - End date
   * @returns Promise with the sentiment history data
   */
  async getCompanySentimentHistory(
    companyId: string,
    period: string = 'daily',
    from?: string,
    to?: string
  ) {
    const params: Record<string, string> = { period };
    if (from) params.from = from;
    if (to) params.to = to;

    return apiClient.get(
      `${API_ENDPOINTS.COMPANIES}/${companyId}/sentiment/history`,
      params
    );
  },

  /**
   * Get articles for a company
   * @param companyId - ID of the company
   * @param limit - Number of articles to return
   * @param offset - Offset for pagination
   * @param source - Filter by source
   * @param sentiment - Filter by sentiment
   * @returns Promise with the articles data
   */
  async getCompanyArticles(
    companyId: string,
    limit: number = 10,
    offset: number = 0,
    source?: string,
    sentiment?: string
  ) {
    const params: Record<string, string | number> = { limit, offset };
    if (source) params.source = source;
    if (sentiment) params.sentiment = sentiment;

    return apiClient.get(
      `${API_ENDPOINTS.COMPANIES}/${companyId}/articles`,
      params
    );
  },

  /**
   * Refresh sentiment data for a company
   * @param companyId - ID of the company
   * @returns Promise with the refresh status
   */
  async refreshCompanySentiment(companyId: string) {
    return apiClient.post(
      `${API_ENDPOINTS.COMPANIES}/${companyId}/sentiment/refresh`,
      {}
    );
  },

  /**
   * Get a list of available companies (mock implementation)
   * @returns Promise with the list of companies
   */
  async getCompanies() {
    // This would normally be an API call, but for demo purposes we'll return mock data
    return {
      status: 'success',
      data: [
        { id: 'hiive', name: 'Hiive' },
        { id: 'bytedance', name: 'ByteDance' },
        { id: 'epic-games', name: 'Epic Games' },
        { id: 'stripe', name: 'Stripe' },
        { id: 'spacex', name: 'SpaceX' },
        { id: 'instacart', name: 'Instacart' },
        { id: 'databricks', name: 'Databricks' },
        { id: 'chime', name: 'Chime' },
        { id: 'plaid', name: 'Plaid' },
        { id: 'fanatics', name: 'Fanatics' },
        { id: 'klarna', name: 'Klarna' },
        { id: 'nubank', name: 'Nubank' },
        { id: 'revolut', name: 'Revolut' },
        { id: 'canva', name: 'Canva' },
        { id: 'automation-anywhere', name: 'Automation Anywhere' }
      ]
    };
  }
};