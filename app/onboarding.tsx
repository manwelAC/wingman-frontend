import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/constants/useTheme';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as const,
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    } as const,
    logoSection: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    } as const,
    wingmanText: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 28,
    } as const,
    tagline: {
      fontSize: theme.typography.styles.body.fontSize,
      fontFamily: 'DMMono-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    } as const,
    buttonSection: {
      width: '100%',
      gap: theme.spacing.md,
    } as const,
    primaryButton: {
      marginBottom: theme.spacing.sm,
    } as const,
  });

  const handleGetStarted = () => {
    // Navigate to intro carousel
    router.push('/intro');
  };

  const handleAlreadyHaveAccount = () => {
    // Navigate to login screen
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={false}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Logo size={200} />
          <Text style={styles.wingmanText}>Wingman</Text>
          <Text style={styles.tagline}>Your partner in grind.</Text>
        </View>

        {/* Button Section */}
        <View style={styles.buttonSection}>
          <Button
            onPress={handleGetStarted}
            label="Get Started"
            variant="primary"
            fullWidth
            style={styles.primaryButton}
          />
          <Button
            onPress={handleAlreadyHaveAccount}
            label="I Already Have an Account"
            variant="secondary"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
