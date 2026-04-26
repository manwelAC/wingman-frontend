/**
 * API Configuration
 * 
 * Environment variables (from .env.local):
 * - EXPO_PUBLIC_API_BASE_URL: Backend API base URL
 * - EXPO_PUBLIC_API_TIMEOUT: Request timeout in milliseconds
 * - EXPO_PUBLIC_DEBUG: Enable debug logging (true/false)
 * 
 * Never commit .env.local to git — add it to .gitignore
 */

export const API_CONFIG = {
  // Read from environment variables (defaults provided)
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api',
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true',
};
