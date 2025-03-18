import { API_ENDPOINTS, ArticleData } from '@hiive/shared';
import { apiClient } from './apiClient';

/**
 * Service for article-related API requests
 */
export const articleService = {
  /**
   * Submit an article for sentiment analysis
   * @param article - Article data to submit
   * @returns Promise with the submission status
   */
  async submitArticle(article: ArticleData) {
    return apiClient.post(
      API_ENDPOINTS.ARTICLES,
      article
    );
  }
};