import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useTheme } from '@/constants/useTheme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface FormData {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
  general?: string;
}

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
    },
    content: {
      paddingVertical: theme.spacing.xl,
      paddingTop: theme.spacing.xl * 2,
    },
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
      lineHeight: 28,
    } as const,
    description: {
      fontSize: theme.typography.styles.body.fontSize,
      fontFamily: 'DMMono-Regular',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
      lineHeight: 20,
    } as const,
    formContainer: {
      marginBottom: theme.spacing.xl,
    },
    loginLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
      gap: 4,
    },
    loginText: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    loginButton: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });

  /**
   * Validate form fields locally
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username must be alphanumeric (letters, numbers, _, -)';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Password confirmation validation
    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleRegister = async () => {
    // Clear general error
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Validate first
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.passwordConfirmation,
      });

      if (!response.success) {
        // Handle validation errors from backend
        if (response.errors) {
          const backendErrors: FormErrors = {};
          Object.entries(response.errors).forEach(([key, messages]) => {
            backendErrors[key as keyof FormErrors] = messages[0];
          });
          setErrors(backendErrors);
        } else {
          setErrors({
            general:
              response.message || 'Registration failed. Please try again.',
          });
        }
        return;
      }

      // Success! Navigate to email verification screen
      router.push({
        pathname: '/auth/verify-email',
        params: { email: formData.email.trim() },
      });
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        general:
          'An unexpected error occurred. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.description}>
          Join Wingman and start logging your grinds today.
        </Text>

        {/* General Error */}
        {errors.general && (
          <View
            style={{
              backgroundColor: theme.colors.statusDanger + '15',
              borderRadius: 8,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: theme.colors.statusDanger,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'DMMono',
                color: theme.colors.statusDanger,
              }}
            >
              {errors.general}
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <TextInput
            label="Username"
            placeholder="Choose your username"
            value={formData.username}
            onChangeText={(text) =>
              setFormData({ ...formData, username: text })
            }
            error={errors.username}
            disabled={loading}
            autoCapitalize="none"
          />

          <TextInput
            label="Email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChangeText={(text) =>
              setFormData({ ...formData, email: text })
            }
            error={errors.email}
            disabled={loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Password"
            placeholder="Min. 8 characters"
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            error={errors.password}
            disabled={loading}
            secureTextEntry={!showPassword}
          />

          <View style={{ 
            marginBottom: theme.spacing.lg,
            marginTop: -theme.spacing.lg + theme.spacing.sm,
          }}>
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: 0,
              }}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={{
                fontSize: 12,
                fontFamily: 'DMMono',
                color: theme.colors.textSecondary,
              }}>
                {showPassword ? 'Hide' : 'Show'} password
              </Text>
            </Pressable>
          </View>

          <TextInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formData.passwordConfirmation}
            onChangeText={(text) =>
              setFormData({ ...formData, passwordConfirmation: text })
            }
            error={errors.passwordConfirmation}
            disabled={loading}
            secureTextEntry={!showPassword}
          />
        </View>

        {/* Submit Button */}
        <View style={{ opacity: loading ? 0.6 : 1 }}>
          <Button
            label={loading ? 'Creating account...' : 'Create Account'}
            variant="primary"
            onPress={handleRegister}
            disabled={loading}
            fullWidth
          />
        </View>

        {/* Login Link */}
        <View style={styles.loginLink}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <Text
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            Log in
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
