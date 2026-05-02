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
    console.log(`📡 [${options.method || 'GET'}] ${url}`, {
      method: options.method || 'GET',
      headers: { ...headers, Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'none' },
      body: options.body,
    });

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
      console.error('URL:', url);
      console.error('Token sent:', token ? `${token.substring(0, 20)}...` : 'none');
      console.error('Request body:', options.body);
      console.error('Response type:', response.headers.get('content-type'));
      console.error('First 300 chars:', text.substring(0, 300));
      
      return {
        success: false,
        status: response.status,
        message: `Server error: ${response.status}. Check Laravel logs and ensure endpoint exists.`,
        data: undefined,
      };
    }

    console.log(`✅ Response [${response.status}] ${url}:`, data);

    if (!response.ok) {
      console.error(`❌ Request failed [${response.status}]:`, data);
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
   * Trust a location after email verification (requires token)
   */
  trustLocation: async (payload: { city: string; country: string }, token: string) =>
    apiCall<{
      message: string;
      trusted_locations: string[];
    }>('/auth/trust-location', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Get user's location from backend secure endpoint
   * Uses request IP to determine city and country
   * Backend handles API credentials securely
   */
  getLocation: async () =>
    apiCall<{
      city: string;
      country: string;
    }>('/auth/get-location', {
      method: 'GET',
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
      token?: string;
      message: string;
      vpn_detected?: boolean;
      require_location_verification?: boolean;
      unverified?: boolean;
      email?: string;
      user?: {
        id: number;
        username: string;
        user_type: string;
        display_name: string;
        email: string;
        games_expertise: string[];
        is_verified: boolean;
        profile_image_url: string | null;
        fingerprint_enrolled?: boolean;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email_or_username: payload.email,
        password: payload.password,
      }),
    }),

  /**
   * Login with fingerprint (biometric)
   */
  loginWithFingerprint: async (emailOrUsername: string) =>
    apiCall<{
      token?: string;
      message: string;
      vpn_detected?: boolean;
      require_location_verification?: boolean;
      unverified?: boolean;
      email?: string;
      user?: {
        id: number;
        username: string;
        user_type: string;
        display_name: string;
        email: string;
        games_expertise: string[];
        is_verified: boolean;
        profile_image_url: string | null;
        fingerprint_enrolled?: boolean;
      };
    }>('/auth/login-fingerprint', {
      method: 'POST',
      body: JSON.stringify({ email_or_username: emailOrUsername }),
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
      fingerprint_enrolled: boolean;
    }>('/auth/me', {}, token),

  /**
   * Enroll fingerprint for current user (requires token)
   */
  enrollFingerprint: async (token: string) =>
    apiCall<{
      message: string;
      fingerprint_enrolled: boolean;
    }>('/auth/enroll-fingerprint', {
      method: 'POST',
    }, token),

  /**
   * Disable fingerprint for current user (requires token)
   */
  disableFingerprint: async (token: string) =>
    apiCall<{
      message: string;
      fingerprint_enrolled: boolean;
    }>('/auth/disable-fingerprint', {
      method: 'POST',
    }, token),
};

/**
 * Game API Calls
 */
export const gameApi = {
  /**
   * Fetch rank tiers for a specific game (requires token)
   */
  fetchRankTiers: async (game: string, token: string) =>
    apiCall<{
      game: string;
      tiers: {
        id: number;
        game: string;
        tier_name: string;
        tier_order: number;
        rank_group?: string;
        tier_number: number;
        stars_per_tier: number;
        is_active: boolean;
      }[];
    }>(`/games/${game}/ranks`, {
      method: 'GET',
    }, token),
};

/**
 * Calculator API Calls
 */
export const calculatorApi = {
  /**
   * Calculate price for a rank boost grind (requires token)
   */
  calculateRankBoost: async (payload: {
    game: string;
    service_type: string;
    starting_tier_id: number;
    target_tier_id: number;
  }, token: string) =>
    apiCall<{
      game: string;
      service_type: string;
      starting_tier_id: number;
      target_tier_id: number;
      total_tiers: number;
      base_price: number;
      crossing_fee: number;
      final_price: number;
    }>('/calculator/rank-boost', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
};

/**
 * Pricing API Calls
 */
export const pricingApi = {
  /**
   * Fetch all pricing ranges for a game (requires token)
   * Returns pricing grouped by game
   */
  fetchPricing: async (game: string, token: string) =>
    apiCall<{
      [key: string]: {
        id: number;
        pilot_id: number;
        game: string;
        range_name: string;
        tier_start_id: number;
        tier_end_id: number;
        price_per_star: string;
        major_rank_crossing_fee: string;
        is_active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
        tierStart: {
          id: number;
          game: string;
          tier_name: string;
          tier_order: number;
          stars_per_tier: number;
        };
        tierEnd: {
          id: number;
          game: string;
          tier_name: string;
          tier_order: number;
          stars_per_tier: number;
        };
      }[];
    }>(`/pricing`, {
      method: 'GET',
    }, token),

  /**
   * Create a new pricing range (requires token)
   */
  createPricing: async (payload: {
    game: string;
    range_name: string;
    tier_start_id: number;
    tier_end_id: number;
    price_per_star?: number;  // For MLBB
    price_per_tier?: number;  // For CODM/Valorant
    major_rank_crossing_fee?: number;
    display_order?: number;
    reason?: string;
  }, token: string) =>
    apiCall<{
      id: number;
      pilot_id: number;
      game: string;
      range_name: string;
      tier_start_id: number;
      tier_end_id: number;
      price_per_star: string;
      major_rank_crossing_fee: string;
      is_active: boolean;
      display_order: number;
      created_at: string;
      updated_at: string;
      tierStart: {
        id: number;
        tier_name: string;
        tier_order: number;
      };
      tierEnd: {
        id: number;
        tier_name: string;
        tier_order: number;
      };
    }>('/pricing', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Update a pricing range (requires token)
   */
  updatePricing: async (id: number, payload: {
    range_name?: string;
    price_per_star?: number;
    major_rank_crossing_fee?: number;
    display_order?: number;
    is_active?: boolean;
    reason?: string;
  }, token: string) =>
    apiCall<{
      id: number;
      pilot_id: number;
      game: string;
      range_name: string;
      tier_start_id: number;
      tier_end_id: number;
      price_per_star: string;
      major_rank_crossing_fee: string;
      is_active: boolean;
      display_order: number;
      updated_at: string;
    }>(`/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Delete a pricing range (requires token)
   */
  deletePricing: async (id: number, token: string) =>
    apiCall<null>(`/pricing/${id}`, {
      method: 'DELETE',
    }, token),
};

/**
 * Customer API Calls
 */
export const customerApi = {
  /**
   * Fetch all customers for the authenticated pilot (requires token)
   */
  fetchCustomers: async (token: string) =>
    apiCall<{
      id: number;
      pilot_id: number;
      display_name: string;
      email: string | null;
      phone: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }[]>('/customers', {
      method: 'GET',
    }, token),

  /**
   * Get a single customer with their grind history (requires token)
   */
  getCustomer: async (id: number, token: string) =>
    apiCall<{
      id: number;
      pilot_id: number;
      display_name: string;
      email: string | null;
      phone: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      grinds: any[];
    }>(`/customers/${id}`, {
      method: 'GET',
    }, token),

  /**
   * Create a new customer (requires token)
   */
  createCustomer: async (payload: {
    display_name: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  }, token: string) =>
    apiCall<{
      id: number;
      pilot_id: number;
      display_name: string;
      email: string | null;
      phone: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Update a customer (requires token)
   */
  updateCustomer: async (id: number, payload: {
    display_name?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  }, token: string) =>
    apiCall<{
      id: number;
      pilot_id: number;
      display_name: string;
      email: string | null;
      phone: string | null;
      notes: string | null;
      updated_at: string;
    }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Delete a customer (requires token)
   */
  deleteCustomer: async (id: number, token: string) =>
    apiCall<null>(`/customers/${id}`, {
      method: 'DELETE',
    }, token),
};

/**
 * Grind API Calls
 */
export const grindApi = {
  /**
   * Create a new grind session (requires token)
   */
  createGrind: async (payload: {
    customer_id: number;
    game: string;
    service_type: string;
    starting_tier_id: number;
    target_tier_id: number;
    base_price: number;
    final_price: number;
    price_per_win?: number;
    target_wins?: number;
    account_username?: string;
    special_instructions?: string;
  }, token: string) =>
    apiCall<{
      id: number;
      grind_number: string;
      pilot_id: number;
      customer_id: number;
      game: string;
      service_type: string;
      starting_tier_id: number;
      target_tier_id: number;
      total_tiers: number;
      base_price: string;
      final_price: string;
      status: string;
      progress_percentage: number;
      current_tier: string;
      account_username: string;
      special_instructions: string;
      started_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
      started_at: string;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
    }>('/grinds', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Fetch all grinds for the authenticated pilot (requires token)
   */
  fetchGrinds: async (token: string) =>
    apiCall<{
      id: number;
      grind_number: string;
      customer_id: number;
      game: string;
      service_type: string;
      status: string;
      progress_percentage: number;
      base_price: string;
      final_price: string;
      started_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
      customer: {
        id: number;
        display_name: string;
      };
      created_at: string;
    }[]>('/grinds', {
      method: 'GET',
    }, token),

  /**
   * Update grind progress and status (start, cancel, update progress)
   */
  updateGrindProgress: async (grindId: number, payload: {
    status?: 'in_progress' | 'cancelled';
    progress_percentage?: number;
    current_tier?: string;
  }, token: string) =>
    apiCall<{
      id: number;
      grind_number: string;
      status: string;
      progress_percentage: number;
      started_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
    }>(`/grinds/${grindId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),

  /**
   * Complete a grind
   */
  completeGrind: async (grindId: number, token: string) =>
    apiCall<{
      id: number;
      grind_number: string;
      status: string;
      progress_percentage: number;
      started_at: string | null;
      completed_at: string | null;
      cancelled_at: string | null;
    }>(`/grinds/${grindId}/complete`, {
      method: 'POST',
    }, token),
};

export default authApi;
