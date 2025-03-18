import { ApiResponse } from '../types';

/**
 * Creates a successful API response
 * @param data The data to include in the response
 * @returns A formatted API success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    status: 'success',
    data,
  };
}

/**
 * Creates an error API response
 * @param code The error code
 * @param message The error message
 * @param requestId Optional request ID for tracking
 * @returns A formatted API error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  requestId?: string
): ApiResponse<never> {
  return {
    status: 'error',
    code,
    message,
    requestId,
  };
}

/**
 * Formats a date as an ISO string
 * @param date The date to format
 * @returns ISO formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Generates a unique ID
 * @returns A unique ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Formats an S3 key for article storage
 * @param companyId The company ID
 * @param timestamp The timestamp
 * @param uuid The UUID
 * @returns Formatted S3 key
 */
export function formatArticleKey(
  companyId: string,
  timestamp: string,
  uuid: string
): string {
  return `articles/${companyId}/${timestamp}-${uuid}.json`;
}

/**
 * Formats an S3 key for analysis storage
 * @param companyId The company ID
 * @param timestamp The timestamp
 * @param uuid The UUID
 * @returns Formatted S3 key
 */
export function formatAnalysisKey(
  companyId: string,
  timestamp: string,
  uuid: string
): string {
  return `analysis/${companyId}/${timestamp}-${uuid}.json`;
}

/**
 * Formats an S3 key for summary storage
 * @param companyId The company ID
 * @returns Formatted S3 key
 */
export function formatSummaryKey(companyId: string): string {
  return `summaries/${companyId}/latest.json`;
}