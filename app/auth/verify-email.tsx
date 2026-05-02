import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useTheme } from '@/constants/useTheme';
import { authApi } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  const email = (params.email as string) || '';
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ code?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
      marginBottom: theme.spacing.md,
      lineHeight: 28,
    } as const,
    description: {
      fontSize: theme.typography.styles.body.fontSize,
      fontFamily: 'DMMono-Regular',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
      lineHeight: 20,
    } as const,
    email: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    codeInput: {
      fontSize: 20,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      letterSpacing: 4,
      textAlign: 'center',
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      gap: 4,
    },
    resendText: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    resendButton: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
  });

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  /**
   * Validate and submit verification code
   */
  const handleVerify = async () => {
    const newErrors: typeof errors = {};

    if (!code.trim()) {
      newErrors.code = 'Enter the 6-digit code';
    } else if (!/^\d{6}$/.test(code)) {
      newErrors.code = 'Code must be exactly 6 digits';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await authApi.verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });

      if (!response.success) {
        setErrors({
          general:
            response.message ||
            'Verification failed. Please check the code and try again.',
        });
        return;
      }

      // Success! Save token and user
      if (response.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem(
          'user',
          JSON.stringify(response.data.user)
        );

        // If this was a new location login, fetch location from backend and trust it
        if (params.isNewLocation === 'true') {
          try {
            // Get user's location from backend (secure endpoint)
            const locationResponse = await authApi.getLocation();
            
            if (locationResponse.success && locationResponse.data) {
              // Trust the location with backend data
              const trustResponse = await authApi.trustLocation(
                {
                  city: locationResponse.data.city,
                  country: locationResponse.data.country,
                },
                response.data.token
              );

              if (trustResponse.success) {
                // Show success message
                console.log('✅ Location trusted successfully');
                router.replace('/(tabs)');
              } else {
                // Even if trust-location fails, user is verified, so proceed
                console.warn('Trust location failed, but email verified:', trustResponse.message);
                router.replace('/(tabs)');
              }
            } else {
              // Even if location fetch fails, user is verified, so proceed
              console.warn('Location fetch failed, but email verified');
              router.replace('/(tabs)');
            }
          } catch (trustError) {
            console.error('Error during location trust process:', trustError);
            // Even if trust-location process fails, user is verified, so proceed
            router.replace('/(tabs)');
          }
        } else {
          // Regular email verification (not a new location)
          console.log('✅ Email verified successfully');
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setErrors({
        general: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend verification code
   */
  const handleResendCode = async () => {
    setResendLoading(true);

    try {
      const response = await authApi.resendCode(email);

      if (!response.success) {
        setErrors({
          general:
            response.message ||
            'Failed to resend code. Please try again later.',
        });
      } else {
        // Start 5-minute (300 second) cooldown
        setResendTimer(300);
        setErrors({});
        setCode('');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setErrors({
        general: 'An error occurred. Please try again.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.description}>
          {params.isNewLocation === 'true'
            ? '📍 We detected a login from a new location. Please verify your email to continue.'
            : `We sent a 6-digit code to `}
          {params.isNewLocation !== 'true' && (
            <>
              <Text style={styles.email}>{email}</Text>
              {'. Enter it below to activate your account.'}
            </>
          )}
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

        {/* Code Input */}
        <TextInput
          label="Verification Code"
          placeholder="000000"
          value={code}
          onChangeText={(text) => {
            // Only allow 6 digits
            const cleaned = text.replace(/[^\d]/g, '').slice(0, 6);
            setCode(cleaned);
          }}
          error={errors.code}
          disabled={loading}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.codeInput}
        />

        {/* Verify Button */}
        <View style={{ opacity: loading ? 0.6 : 1, marginBottom: theme.spacing.xl }}>
          <Button
            label={loading ? 'Verifying...' : 'Verify Code'}
            variant="primary"
            onPress={handleVerify}
            disabled={loading}
            fullWidth
          />
        </View>

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <Text
            style={[
              styles.resendButton,
              {
                opacity: resendTimer > 0 || resendLoading ? 0.5 : 1,
              },
            ]}
            onPress={resendTimer === 0 && !resendLoading ? handleResendCode : undefined}
          >
            {resendLoading ? 'Sending...' : resendTimer > 0 ? `Resend (${formatTime(resendTimer)})` : 'Resend'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
