/**
 * API Service - Wingman Backend Integration
 * Uses configurable base URL from config/api.ts
 */

import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      // Response is not JSON (likely HTML error page)
      console.error('⚠️  Server returned non-JSON response:');
      console.error('Status:', response.status);
      console.error('First 200 chars:', text.substring(0, 200));
      
      return {
        success: false,
        status: response.status,
        message: `Server error: ${response.status}. Check Laravel logs.`,
        data: undefined,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: data.message,
        errors: data.errors,
        data,
      };
    }

    return {
      success: true,
      status: response.status,
      data,
      message: data.message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`API Error [${endpoint}]:`, {
      url,
      error: errorMsg,
      message: 'Failed to connect to backend. Check API_BASE_URL in config/api.ts',
    });
    return {
      success: false,
      status: 0,
      message: 'Network error. Make sure the backend is running and API_BASE_URL is correct.',
      data: error as any,
    };
  }
}

/**
 * Health Check - Verify backend connection
 * Call this on app startup to ensure the backend is reachable
 */
export const checkBackendHealth = async (): Promise<{
  isConnected: boolean;
  message: string;
  baseUrl: string;
}> => {
  try {
    console.log('🔍 Checking backend connection...');
    // Make a simple GET request to the base URL
    // Any HTTP response means the server is running (even 404 is OK)
    // We only care about network/timeout errors
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/`, { 
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    // If we got any HTTP response, the backend is reachable
    console.log('✅ Backend connected:', API_BASE_URL);
    
    return {
      isConnected: true,
      message: 'Connected to backend',
      baseUrl: API_BASE_URL,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Backend connection failed:', {
      baseUrl: API_BASE_URL,
      error: errorMsg,
    });
    return {
      isConnected: false,
      message: `Backend unreachable: ${errorMsg}`,
      baseUrl: API_BASE_URL,
    };
  }
};

/**
 * Auth API Calls
 */
export const authApi = {
  /**
   * Register new pilot account
   */
  register: async (payload: {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    apiCall<{ email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Verify email with 6-digit code
   */
  verifyEmail: async (payload: { email: string; code: string }) =>
    apiCall<{
      token: string;
      user: {
        id: number;
        username: string;
        display_name: string;
        email: string;
        user_type: string;
      };
    }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Resend verification code
   */
  resendCode: async (email: string) =>
    apiCall<null>('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /**
   * Login with email and password
   */
  login: async (payload: { email: string; password: string }) =>
    apiCall<{
      token: string;
      user: {
        id: number;
        username: string;
        user_type: string;
        display_name: string;
        email: string;
        games_expertise: string[];
        is_verified: boolean;
        profile_image_url: string | null;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Logout (requires token)
   */
  logout: async (token: string) =>
    apiCall<null>('/auth/logout', {
      method: 'POST',
    }, token),

  /**
   * Get current user profile (requires token)
   */
  me: async (token: string) =>
    apiCall<{
      id: number;
      username: string;
      user_type: string;
      display_name: string;
      email: string;
      bio: string | null;
      games_expertise: string[];
      is_verified: boolean;
      profile_image_url: string | null;
      is_active: boolean;
      joined_at: string;
    }>('/auth/me', {}, token),
};

export default authApi;
