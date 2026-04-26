/**
 * Wingman Design System Color Palette
 */

import { Platform } from 'react-native';

// Primary palette - consistent across both modes
const PRIMARY = '#4A6CF7';
const PRIMARY_PRESSED = '#3A5CE6';

// Status colors - same in both modes
const STATUS_ACTIVE = '#4A6CF7';
const STATUS_SUCCESS = '#22C55E';
const STATUS_WARNING = '#F59E0B';
const STATUS_DANGER = '#EF4444';

export const Colors = {
  light: {
    // Primary palette
    primary: PRIMARY,
    primaryPressed: PRIMARY_PRESSED,
    
    // Backgrounds & surfaces
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceRaised: '#EEEEEE',
    border: '#E0E0E0',
    
    // Text
    textPrimary: '#111111',
    textSecondary: '#666666',
    textOnPrimary: '#FFFFFF',
    
    // Status colors
    statusActive: STATUS_ACTIVE,
    statusSuccess: STATUS_SUCCESS,
    statusWarning: STATUS_WARNING,
    statusDanger: STATUS_DANGER,
    
    // Legacy aliases for compatibility
    text: '#111111',
    tint: PRIMARY,
    icon: '#666666',
    tabIconDefault: '#666666',
    tabIconSelected: PRIMARY,
  },
  dark: {
    // Primary palette
    primary: PRIMARY,
    primaryPressed: PRIMARY_PRESSED,
    
    // Backgrounds & surfaces
    background: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceRaised: '#222222',
    border: '#2C2C2C',
    
    // Text
    textPrimary: '#F0F0F0',
    textSecondary: '#888888',
    textOnPrimary: '#FFFFFF',
    
    // Status colors
    statusActive: STATUS_ACTIVE,
    statusSuccess: STATUS_SUCCESS,
    statusWarning: STATUS_WARNING,
    statusDanger: STATUS_DANGER,
    
    // Legacy aliases for compatibility
    text: '#F0F0F0',
    tint: PRIMARY,
    icon: '#888888',
    tabIconDefault: '#888888',
    tabIconSelected: PRIMARY,
  },
};

// Typography system - includes pre-configured text styles
export const Typography = {
  // Font sizes
  sizes: {
    display: 28,      // 800 ExtraBold - screen titles
    heading: 22,      // 700 Bold - section headers
    subheading: 17,   // 600 SemiBold - labels, tabs
    body: 15,         // 400 Regular - content
    caption: 13,      // 400 Regular - hints, secondary info
  },
  // Font weights
  weights: {
    regular: 'normal' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  // Pre-configured text styles (to be used with light/dark themes)
  styles: {
    display: {
      fontSize: 28,
      fontWeight: 'bold' as any,
      fontFamily: 'DMMono-Medium',
      lineHeight: 36,
    },
    heading: {
      fontSize: 22,
      fontWeight: 'bold' as any,
      fontFamily: 'DMMono-Medium',
      lineHeight: 28,
    },
    subheading: {
      fontSize: 17,
      fontWeight: '600' as any,
      fontFamily: 'DMMono-Medium',
      lineHeight: 22,
    },
    body: {
      fontSize: 15,
      fontWeight: 'normal' as any,
      fontFamily: 'DMMono-Regular',
      lineHeight: 20,
    },
    bodyBold: {
      fontSize: 15,
      fontWeight: 'bold' as any,
      fontFamily: 'DMMono-Medium',
      lineHeight: 20,
    },
    caption: {
      fontSize: 13,
      fontWeight: 'normal' as any,
      fontFamily: 'DMMono-Regular',
      lineHeight: 18,
    },
    button: {
      fontSize: 15,
      fontWeight: 'bold' as any,
      fontFamily: 'DMMono-Medium',
      lineHeight: 20,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
  },
};

// Spacing system
export const Spacing = {
  xs: 4,    // Tight gaps
  sm: 8,    // Icon spacing
  md: 16,   // Card padding
  lg: 24,   // Section spacing
  xl: 32,   // Screen padding
  '2xl': 48, // Large breaks
};

// Shadow system
export const Shadows = {
  subtle: {
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.06)',
  },
  medium: {
    elevation: 8,
    shadowColor: 'rgba(0,0,0,0.12)',
  },
  buttonPressed: {
    elevation: 4,
    shadowColor: '#2A4CC7', // Darker blue for pressed button shadow
  },
};

// Border radius system
export const BorderRadius = {
  sm: 12,
  md: 16,
  pill: 999,
};

export const Fonts = Platform.select({
  ios: {
    light: 'DMMono-Light',
    sans: 'DMMono-Regular',
    serif: 'ui-serif',
    rounded: 'DMMono-Medium',
    mono: 'ui-monospace',
  },
  default: {
    light: 'DMMono-Light',
    sans: 'DMMono-Regular',
    serif: 'serif',
    rounded: 'DMMono-Medium',
    mono: 'monospace',
  },
  web: {
    light: "'DM Mono', 'Courier New', monospace",
    sans: "'DM Mono', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'DM Mono', sans-serif",
    mono: "'DM Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
