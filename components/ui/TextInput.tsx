import { useTheme } from '@/constants/useTheme';
import React from 'react';
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    Text,
    View,
} from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function TextInput({
  label,
  placeholder,
  error,
  disabled,
  style,
  ...props
}: TextInputProps) {
  const theme = useTheme();

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'DMMono',
            fontWeight: 'bold',
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
      )}
      <RNTextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        editable={!disabled}
        style={[
          {
            height: 52,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: error ? theme.colors.statusDanger : theme.colors.border,
            paddingHorizontal: theme.spacing.md,
            fontSize: 15,
            fontFamily: 'DMMono',
            color: theme.colors.textPrimary,
            backgroundColor: disabled ? theme.colors.surface : theme.colors.background,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'DMMono',
            color: theme.colors.statusDanger,
            marginTop: theme.spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
