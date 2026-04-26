/**
 * API Configuration
 * Update the API_BASE_URL based on your environment:
 * 
 * Android Emulator:    http://10.0.2.2:8000/api
 * iOS Simulator:       http://127.0.0.1:8000/api
 * Real Device:         http://YOUR_MACHINE_IP:8000/api (e.g., http://192.168.1.100:8000/api)
 * 
 * To find your machine IP:
 * - Windows: Run 'ipconfig' in PowerShell, look for IPv4 Address
 * - Mac/Linux: Run 'ifconfig' in terminal, look for inet address
 */

export const API_CONFIG = {
  // Change this based on your environment (see comments above)
  BASE_URL: 'http://192.168.100.4:8000/api',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 10000,
  
  // Enable console logging for debugging
  DEBUG: true,
};
