import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useTheme } from '@/constants/useTheme';
import { authApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  emailOrUsername: string;
  password: string;
}

interface FormErrors {
  emailOrUsername?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    emailOrUsername: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);

  // Check if device supports biometrics on component mount
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setBiometricAvailable(compatible);
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setBiometricAvailable(false);
      }
    };
    checkBiometric();
  }, []);

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
    registerLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
      gap: 4,
    },
    registerText: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    registerButton: {
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

    // Email or Username validation
    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleLogin = async () => {
    // Clear general error
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Validate first
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({
        email: formData.emailOrUsername.trim(),
        password: formData.password,
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
              response.message || 'Login failed. Please try again.',
          });
        }
        return;
      }

      // Check if user is unverified (status 200 with unverified flag)
      if (response.data?.unverified) {
        // User exists but email not verified - redirect to verify email
        router.push({
          pathname: '/auth/verify-email',
          params: { email: response.data.user?.email || formData.emailOrUsername.trim() },
        });
        return;
      }

      // Save token and user to AsyncStorage
      if (response.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        if (response.data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Redirect to dashboard
        router.push('/(tabs)');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general:
          'An unexpected error occurred. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle fingerprint/biometric login
   */
  const handleFingerprintLogin = async () => {
    // Validate email/username is entered
    if (!formData.emailOrUsername.trim()) {
      setErrors({ general: 'Please enter your email or username first' });
      return;
    }

    setFingerprintLoading(true);

    try {
      // Prompt for fingerprint
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Authenticate to login to Wingman',
      });

      if (!result.success) {
        setErrors({ general: 'Fingerprint authentication failed' });
        return;
      }

      // Call fingerprint login endpoint
      const response = await authApi.loginWithFingerprint(
        formData.emailOrUsername.trim()
      );

      if (!response.success) {
        setErrors({
          general: response.message || 'Fingerprint login failed. Please try again.',
        });
        return;
      }

      // Check if user is unverified
      if (response.data?.unverified) {
        router.push({
          pathname: '/auth/verify-email',
          params: { email: response.data.user?.email || formData.emailOrUsername.trim() },
        });
        return;
      }

      // Save token and user to AsyncStorage
      if (response.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        if (response.data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Redirect to dashboard
        router.push('/(tabs)');
      }
    } catch (error) {
      console.error('Fingerprint login error:', error);
      setErrors({
        general: 'An error occurred during fingerprint authentication.',
      });
    } finally {
      setFingerprintLoading(false);
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.description}>
            Log in to continue tracking your grinds.
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

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Email or Username */}
            <TextInput
              label="Email or Username"
              placeholder="you@example.com or username"
              value={formData.emailOrUsername}
              onChangeText={(emailOrUsername) =>
                setFormData({ ...formData, emailOrUsername })
              }
              error={errors.emailOrUsername}
              editable={!loading}
              autoCapitalize="none"
              placeholderTextColor={theme.colors.textSecondary + '60'}
            />

            {/* Password */}
            <View style={{ marginTop: theme.spacing.md }}>
              <TextInput
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(password) =>
                  setFormData({ ...formData, password })
                }
                error={errors.password}
                editable={!loading}
                secureTextEntry={!showPassword}
                rightIcon={
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
            </View>

            {/* Login Button */}
            <View style={{ marginTop: theme.spacing.xl }}>
              <Button
                label="Log In"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
                fullWidth
              />
            </View>

            {/* Fingerprint Divider */}
            {biometricAvailable && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: theme.spacing.lg,
                    gap: theme.spacing.md,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: theme.colors.border,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'DMMono',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    or use fingerprint
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: theme.colors.border,
                    }}
                  />
                </View>

                {/* Fingerprint Button */}
                <Pressable
                  onPress={handleFingerprintLogin}
                  disabled={fingerprintLoading}
                  style={{
                    paddingVertical: theme.spacing.md,
                    paddingHorizontal: theme.spacing.lg,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    opacity: fingerprintLoading ? 0.6 : 1,
                  }}
                >
                  <Ionicons
                    name="finger-print"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'DMMono',
                      fontWeight: 'bold',
                      color: theme.colors.primary,
                    }}
                  >
                    {fingerprintLoading ? 'Scanning...' : 'Use Fingerprint'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Register Link */}
          <View style={styles.registerLink}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerButton}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
