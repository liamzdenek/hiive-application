/**
 * Frontend configuration
 * 
 * This file contains configuration settings for the frontend application.
 * The API_BASE_URL is configurable via environment variables to support
 * different deployment environments.
 */

// Default to localhost:3001 for local development
const DEFAULT_API_URL = 'http://localhost:3001';

// Configuration object
export const config = {
  // API base URL - can be overridden with VITE_API_BASE_URL environment variable
  // This will be set during the build process by the deploy script
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL,
  
  // Version of the application
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
  
  // Environment (development, staging, production)
  ENVIRONMENT: import.meta.env.MODE || 'development',
};

// Log the API URL during development to help with debugging
if (config.ENVIRONMENT === 'development') {
  console.log('API Base URL:', config.API_BASE_URL);
}

// Export individual config values for convenience
export const { API_BASE_URL, APP_VERSION, ENVIRONMENT } = config;