import { useTheme } from '@/constants/useTheme';
import React from 'react';
import {
    Pressable,
    Text,
    View,
    ViewStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * 
 * Font Strategy:
 * - Uses DM Mono Medium (500) + bold fontWeight for strong branding
 * - DM Mono doesn't have a 700 Bold variant, so Medium (500) is the heaviest weight
 * - fontWeight: 'bold' ensures maximum boldness within DM Mono's available weights
 * - Maintains consistent monospace aesthetic across all buttons
 */
export function Button({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const getButtonColor = () => {
    if (disabled) return theme.colors.border;
    if (variant === 'primary') return theme.colors.primary;
    if (variant === 'destructive') return theme.colors.statusDanger;
    return 'transparent';
  };

  const getShadowColor = () => {
    if (variant === 'primary') return '#2A4CC7';
    if (variant === 'destructive') return '#B91C1C';
    return 'transparent';
  };

  const buttonColor = getButtonColor();
  const shadowColor = getShadowColor();
  const showShadow = !disabled && (variant === 'primary' || variant === 'destructive');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        width: fullWidth ? '100%' : 'auto',
        ...style,
      })}
    >
      {({ pressed }) => (
        <View
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Solid 3D shadow layer */}
          {showShadow && (
            <View
              style={{
                position: 'absolute',
                top: pressed ? 2 : 8,
                left: 0,
                right: 0,
                height: 56,
                backgroundColor: shadowColor,
                borderRadius: 999,
                opacity: 1,
              }}
            />
          )}

          {/* Main button */}
          <View
            style={{
              height: 56,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: buttonColor,
              borderRadius: 999,
              borderWidth: variant === 'secondary' ? 2 : 0,
              borderColor: variant === 'secondary' ? theme.colors.primary : undefined,
              opacity: disabled ? 0.5 : 1,
              transform: [{ translateY: pressed && !disabled ? 6 : 0 }],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.styles.button.fontSize,
                fontFamily: 'DMMono',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color:
                  variant === 'secondary'
                    ? theme.colors.primary
                    : variant === 'destructive'
                    ? theme.colors.textOnPrimary
                    : variant === 'primary'
                    ? theme.colors.textOnPrimary
                    : theme.colors.textSecondary,
              }}
            >
              {label}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
