import { Button } from '@/components/ui/Button';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import FloatingNav from '@/components/ui/FloatingNav';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { useTheme } from '@/constants/useTheme';
import { authApi, paymentMethodApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface UserProfile {
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
}

const logoMap: Record<string, any> = {
  'payment-logo/GCASH.png': require('../../assets/images/payment-logo/GCASH.png'),
  'payment-logo/MAYA.png': require('../../assets/images/payment-logo/MAYA.png'),
  'payment-logo/Paypal.png': require('../../assets/images/payment-logo/Paypal.png'),
  'payment-logo/maribank.png': require('../../assets/images/payment-logo/maribank.png'),
  'payment-logo/BDO.png': require('../../assets/images/payment-logo/BDO.png'),
  'payment-logo/BPI.png': require('../../assets/images/payment-logo/BPI.png'),
  'payment-logo/UnionBank.png': require('../../assets/images/payment-logo/UnionBank.png'),
  'payment-logo/PNB.png': require('../../assets/images/payment-logo/PNB.png'),
  'payment-logo/Eastwest.png': require('../../assets/images/payment-logo/Eastwest.png'),
};

export default function ProfileScreen() {
  const theme = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [disableConfirmVisible, setDisableConfirmVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment Methods State
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [userPaymentMethods, setUserPaymentMethods] = useState<any>({
    e_wallet: [],
    bank_transfer: [],
    credit_card: [],
  });
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Load profile and payment methods only on initial mount
  useEffect(() => {
    loadProfile();
    loadPaymentMethods();
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricAvailable(compatible);
    } catch (error) {
      console.warn('Biometric check unavailable:', error);
      setBiometricAvailable(false);
    }
  };

  const loadProfile = async () => {
    try {
      // Try to load from cache first
      const cachedProfile = await AsyncStorage.getItem('cachedProfile');
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
        // Don't show loading spinner if we have cached data
      } else {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No token found');
        return;
      }

      const response = await authApi.me(token);
      if (response.success && response.data) {
        setProfile(response.data);
        // Cache the profile data
        await AsyncStorage.setItem('cachedProfile', JSON.stringify(response.data));
      }
    } catch (error) {
      console.warn('Failed to load profile:', error);
      setErrorMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFingerprint = async () => {
    if (!biometricAvailable) {
      setErrorMessage('Biometric authentication is not available on this device');
      return;
    }

    try {
      setEnrolling(true);

      // Prompt user to authenticate with their fingerprint
      const authenticated = await LocalAuthentication.authenticateAsync({
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (!authenticated.success) {
        setErrorMessage('Fingerprint enrollment was cancelled');
        return;
      }

      // Call backend to enroll fingerprint
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setErrorMessage('Authentication token not found');
        return;
      }

      const response = await authApi.enrollFingerprint(token);

      if (response.success) {
        setProfile((prev) =>
          prev ? { ...prev, fingerprint_enrolled: true } : null
        );
        setSuccessTitle('Success');
        setSuccessMessage('Fingerprint enrolled successfully! You can now use it to login.');
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(response.message || 'Failed to enroll fingerprint');
      }
    } catch (error) {
      console.warn('Fingerprint enrollment failed:', error);
      setErrorMessage('Failed to enroll fingerprint. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDisableFingerprint = async () => {
    setDisableConfirmVisible(true);
  };

  const confirmDisableFingerprint = async () => {
    try {
      setDisabling(true);
      setDisableConfirmVisible(false);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setErrorMessage('Authentication token not found');
        return;
      }

      const response = await authApi.disableFingerprint(token);

      if (response.success) {
        setProfile((prev) =>
          prev ? { ...prev, fingerprint_enrolled: false } : null
        );
        setSuccessTitle('Success');
        setSuccessMessage('Fingerprint disabled successfully');
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(response.message || 'Failed to disable fingerprint');
      }
    } catch (error) {
      console.warn('Fingerprint disable failed:', error);
      setErrorMessage('Failed to disable fingerprint. Please try again.');
    } finally {
      setDisabling(false);
    }
  };

  const handleLogout = async () => {
    setLogoutConfirmVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      setLogoutConfirmVisible(false);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setErrorMessage('Authentication token not found');
        return;
      }

      const response = await authApi.logout(token);

      if (response.success) {
        // Clear auth token and navigate to login
        await AsyncStorage.removeItem('authToken');
        router.replace('/auth/login');
      } else {
        setErrorMessage(response.message || 'Failed to logout');
      }
    } catch (error) {
      console.warn('Logout failed:', error);
      setErrorMessage('Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      // Try to load from cache first
      const cachedAvailable = await AsyncStorage.getItem('cachedAvailableMethods');
      const cachedUser = await AsyncStorage.getItem('cachedPaymentMethods');

      if (cachedAvailable && cachedUser) {
        setAvailableMethods(JSON.parse(cachedAvailable));
        const userCached = JSON.parse(cachedUser);
        // Handle both object format (with categories) and array format
        if (Array.isArray(userCached)) {
          setUserPaymentMethods({
            e_wallet: [],
            bank_transfer: [],
            credit_card: [],
          });
        } else {
          setUserPaymentMethods(userCached);
        }
        // Don't show loading spinner if we have cached data
      } else {
        setLoadingPaymentMethods(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const [availableRes, userRes] = await Promise.all([
        paymentMethodApi.getAvailableMethods(token),
        paymentMethodApi.getUserMethods(token),
      ]);

      if (availableRes.success && availableRes.data && availableRes.data.data) {
        const allMethods = [
          ...(availableRes.data.data.e_wallet || []),
          ...(availableRes.data.data.bank_transfer || []),
          ...(availableRes.data.data.credit_card || []),
        ];
        setAvailableMethods(allMethods);
        await AsyncStorage.setItem('cachedAvailableMethods', JSON.stringify(allMethods));
      }

      if (userRes.success && userRes.data && userRes.data.data) {
        const userMethods = {
          e_wallet: userRes.data.data.e_wallet || [],
          bank_transfer: userRes.data.data.bank_transfer || [],
          credit_card: userRes.data.data.credit_card || [],
        };
        setUserPaymentMethods(userMethods);
        await AsyncStorage.setItem('cachedPaymentMethods', JSON.stringify(userMethods));
      }
    } catch (error) {
      console.warn('Payment methods loading failed:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.md,
      marginBottom: 0,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: 120,
    },
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    displayName: {
      fontSize: 20,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    username: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    userType: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.primary + '20',
      borderRadius: 6,
    },
    profileInfo: {
      marginBottom: theme.spacing.lg,
    },
    infoRow: {
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoLastRow: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    infoLabel: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    sectionTitle: {
      fontSize: theme.typography.styles.subheading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.lg,
    },
    fingerprintCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    fingerprintHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    fingerprintIcon: {
      marginRight: theme.spacing.md,
    },
    fingerprintInfo: {
      flex: 1,
    },
    fingerprintTitle: {
      fontSize: 15,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    fingerprintStatus: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    fingerprintEnrolled: {
      color: theme.colors.statusSuccess,
    },
    fingerprintNotEnrolled: {
      color: theme.colors.statusDanger,
    },
    fingerprintUnavailable: {
      color: theme.colors.textSecondary,
    },
    buttonContainer: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    centeredText: {
      textAlign: 'center',
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
  });

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
        <FloatingNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage && (
          <View
            style={{
              backgroundColor: theme.colors.statusDanger + '20',
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.statusDanger,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'DMMono',
                color: theme.colors.statusDanger,
                marginBottom: 8,
              }}
            >
              Error
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'DMMono',
                color: theme.colors.statusDanger,
              }}
            >
              {errorMessage}
            </Text>
            <Pressable
              onPress={() => setErrorMessage('')}
              style={{ marginTop: 8 }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'DMMono',
                  color: theme.colors.statusDanger,
                  fontWeight: 'bold',
                }}
              >
                Dismiss
              </Text>
            </Pressable>
          </View>
        )}
        {profile ? (
          <>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <Text style={styles.displayName}>{profile.display_name}</Text>
                <Text style={styles.username}>@{profile.username}</Text>
                <Text style={styles.userType}>
                  {profile.user_type.toUpperCase()}
                </Text>
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{profile.email}</Text>
                </View>

                {profile.games_expertise && profile.games_expertise.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Games Expertise</Text>
                    <Text style={styles.infoValue}>
                      {profile.games_expertise.join(', ')}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(profile.joined_at)}
                  </Text>
                </View>

                <View style={[styles.infoRow, styles.infoLastRow]}>
                  <Text style={styles.infoLabel}>Account Status</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: profile.is_active
                          ? theme.colors.statusSuccess
                          : theme.colors.statusDanger,
                      },
                    ]}
                  >
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Methods Section */}
            <Text style={styles.sectionTitle}>Payment Methods</Text>

            <Pressable
              onPress={() => router.push('/payment-methods')}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'DMMono',
                    fontWeight: 'bold',
                    color: theme.colors.textPrimary,
                  }}
                >
                  Your Payment Methods
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              {loadingPaymentMethods ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ paddingVertical: theme.spacing.lg }}
                />
              ) : (() => {
                const allMethods = [
                  ...userPaymentMethods.e_wallet,
                  ...userPaymentMethods.bank_transfer,
                  ...userPaymentMethods.credit_card,
                ];
                const displayMethods = allMethods.slice(0, 3);

                return displayMethods.length === 0 ? (
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'DMMono',
                      color: theme.colors.textSecondary,
                      textAlign: 'center',
                      paddingVertical: theme.spacing.lg,
                    }}
                  >
                    No payment methods yet
                  </Text>
                ) : (
                  <View>
                    {displayMethods.map((method: any) => {
                      const methodType = availableMethods.find(
                        m => m.id === method.payment_method_type_id
                      );
                      return (
                        <View
                          key={method.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: theme.spacing.sm,
                            marginBottom:
                              displayMethods.indexOf(method) < displayMethods.length - 1
                                ? theme.spacing.sm
                                : 0,
                            borderBottomWidth:
                              displayMethods.indexOf(method) < displayMethods.length - 1
                                ? 1
                                : 0,
                            borderBottomColor: theme.colors.border,
                          }}
                        >
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              backgroundColor: theme.colors.primary + '20',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: theme.spacing.md,
                            }}
                          >
                            {methodType?.logo_path && logoMap[methodType.logo_path] ? (
                              <Image
                                source={logoMap[methodType.logo_path]}
                                style={{ width: 20, height: 20, borderRadius: 4 }}
                              />
                            ) : (
                              <Ionicons
                                name={methodType?.icon_name as any}
                                size={16}
                                color={theme.colors.primary}
                              />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontFamily: 'DMMono',
                                fontWeight: 'bold',
                                color: theme.colors.textPrimary,
                              }}
                            >
                              {methodType?.name || 'Unknown'}
                            </Text>
                            {method.account_holder_name && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'DMMono',
                                  color: theme.colors.textSecondary,
                                }}
                              >
                                {method.account_holder_name}
                              </Text>
                            )}
                          </View>
                          {!method.is_active && (
                            <Text
                              style={{
                                fontSize: 10,
                                fontFamily: 'DMMono',
                                color: theme.colors.statusDanger,
                                paddingVertical: 2,
                                paddingHorizontal: 6,
                                backgroundColor: theme.colors.statusDanger + '20',
                                borderRadius: 4,
                              }}
                            >
                              Disabled
                            </Text>
                          )}
                        </View>
                      );
                    })}
                    {allMethods.length > 3 && (
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'DMMono',
                          color: theme.colors.primary,
                          marginTop: theme.spacing.md,
                          fontWeight: 'bold',
                        }}
                      >
                        + {allMethods.length - 3} more
                      </Text>
                    )}
                  </View>
                );
              })()}
            </Pressable>

            {/* Fingerprint Section */}
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.fingerprintCard}>
              <View style={styles.fingerprintHeader}>
                <View style={styles.fingerprintIcon}>
                  <Ionicons
                    name={
                      profile.fingerprint_enrolled
                        ? 'finger-print'
                        : 'finger-print-outline'
                    }
                    size={24}
                    color={
                      !biometricAvailable
                        ? theme.colors.textSecondary
                        : profile.fingerprint_enrolled
                        ? theme.colors.statusSuccess
                        : theme.colors.primary
                    }
                  />
                </View>

                <View style={styles.fingerprintInfo}>
                  <Text style={styles.fingerprintTitle}>Fingerprint Login</Text>
                  <Text
                    style={[
                      styles.fingerprintStatus,
                      !biometricAvailable
                        ? styles.fingerprintUnavailable
                        : profile.fingerprint_enrolled
                        ? styles.fingerprintEnrolled
                        : styles.fingerprintNotEnrolled,
                    ]}
                  >
                    {!biometricAvailable
                      ? 'Not available on this device'
                      : profile.fingerprint_enrolled
                      ? 'Enrolled • Enabled'
                      : 'Not enrolled'}
                  </Text>
                </View>
              </View>

              {biometricAvailable && (
                <Text
                  style={[
                    styles.centeredText,
                    { marginBottom: theme.spacing.md },
                  ]}
                >
                  {profile.fingerprint_enrolled
                    ? 'You can use your fingerprint to quickly login to your account.'
                    : 'Enable fingerprint authentication for quick and secure login.'}
                </Text>
              )}

              {biometricAvailable && (
                <View style={styles.buttonContainer}>
                  {!profile.fingerprint_enrolled ? (
                    <Button
                      label={enrolling ? 'Setting up...' : 'Enable Fingerprint'}
                      onPress={handleEnrollFingerprint}
                      variant="primary"
                      fullWidth
                      disabled={enrolling}
                    />
                  ) : (
                    <Button
                      label={disabling ? 'Disabling...' : 'Disable Fingerprint'}
                      onPress={handleDisableFingerprint}
                      variant="destructive"
                      fullWidth
                      disabled={disabling}
                    />
                  )}
                </View>
              )}
            </View>

            {/* Logout Section */}
            <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
              <Button
                label={loggingOut ? 'Logging out...' : 'Logout'}
                onPress={handleLogout}
                variant="destructive"
                fullWidth
                disabled={loggingOut}
              />
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.centeredText}>Unable to load profile</Text>
          </View>
        )}
      </ScrollView>

      <SuccessModal
        visible={successModalVisible}
        title={successTitle}
        message={successMessage}
        onDismiss={() => setSuccessModalVisible(false)}
      />

      <DeleteConfirmationModal
        visible={disableConfirmVisible}
        title="Disable Fingerprint?"
        message="You will no longer be able to use fingerprint authentication to login."
        loading={disabling}
        onConfirm={confirmDisableFingerprint}
        onCancel={() => setDisableConfirmVisible(false)}
      />

      <DeleteConfirmationModal
        visible={logoutConfirmVisible}
        title="Logout?"
        message="You will be logged out of your account. You can log back in anytime."
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmVisible(false)}
        confirmText="Logout"
        iconName="log-out-outline"
        isDangerous={false}
      />

      <FloatingNav />
    </SafeAreaView>
  );
}
