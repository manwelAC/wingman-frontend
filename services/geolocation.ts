/**
 * Geolocation Service - Get user's city and country from backend
 * Used for location-based security features (VPN detection, anomaly detection)
 * 
 * IMPORTANT: Uses backend endpoint to keep API credentials secure
 * Backend handles IPQualityScore API calls safely
 */

import { API_CONFIG } from '@/config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface LocationData {
  city: string;
  country: string;
  ip?: string;
  region?: string;
}

/**
 * Get user's location from backend secure endpoint
 * Backend uses IPQualityScore API and keeps credentials safe
 * Frontend receives only city/country data
 * 
 * Uses request IP to determine location
 * No authentication required - backend validates by IP
 */
export const getLocationFromBackend = async (): Promise<LocationData | null> => {
  try {
    console.log('📍 Fetching location from backend secure endpoint...');
    
    const url = `${API_BASE_URL}/api/auth/get-location`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Location fetch error:', response.status);
      return null;
    }

    const data = await response.json();

    const location: LocationData = {
      city: data.city || 'Unknown',
      country: data.country || 'Unknown',
    };

    console.log('✅ Location fetched from backend:', location);
    return location;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Location fetch error:', errorMsg);
    // Gracefully degrade - return null but don't crash
    return null;
  }
};

/**
 * Format location for display
 */
export const formatLocation = (location: LocationData): string => {
  return `${location.city}, ${location.country}`;
};
