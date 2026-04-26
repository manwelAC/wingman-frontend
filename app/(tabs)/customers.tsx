import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function CustomersScreen() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
    },
    placeholder: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Customers</Text>
      <Text style={styles.placeholder}>Customer list coming soon...</Text>
      <FloatingNav />
    </SafeAreaView>
  );
}
