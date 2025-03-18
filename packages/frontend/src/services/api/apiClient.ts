import { ApiResponse } from '@hiive/shared';
import { API_BASE_URL } from '../../config';

/**
 * API client for making requests to the backend
 * Uses the configurable API_BASE_URL from config.ts
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request to the API
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          status: 'error',
          code: errorData.code || 'UNKNOWN_ERROR',
          message: errorData.message || 'An unknown error occurred',
        };
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * Make a POST request to the API
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @returns Promise with the response data
   */
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          status: 'error',
          code: errorData.code || 'UNKNOWN_ERROR',
          message: errorData.message || 'An unknown error occurred',
        };
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Also export the class for testing or custom instances
export default ApiClient;