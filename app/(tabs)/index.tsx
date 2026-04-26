import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
    },
    content: {
      paddingTop: theme.spacing.xl,
      paddingBottom: 120,
    },
    greeting: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing['2xl'],
      marginBottom: theme.spacing.sm,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      marginTop: -theme.spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    },
    statValue: {
      fontSize: 32,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    statLabel: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: theme.typography.styles.subheading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    grindCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    grindHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    grindNumber: {
      fontSize: 14,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    statusBadge: {
      backgroundColor: '#EEF2FF',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    grindInfo: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    placeholder: {
      textAlign: 'center',
      paddingVertical: theme.spacing.xl,
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Welcome back, Pilot</Text>

        {/* Stat Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Total Grinds</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Total Earned Card */}
        <View style={[styles.statCard, { marginBottom: theme.spacing.xl }]}>
          <Text style={styles.statValue}>₱1,450.00</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>

        {/* Active Grinds Section */}
        <Text style={styles.sectionTitle}>Active Grinds</Text>
        <View>
          <View style={styles.grindCard}>
            <View style={styles.grindHeader}>
              <Text style={styles.grindNumber}>GRD-0001</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>IN PROGRESS</Text>
              </View>
            </View>
            <Text style={styles.grindInfo}>John Doe • CODM</Text>
            <Text style={styles.grindInfo}>Master I → Legendary</Text>
            <Text style={styles.grindInfo}>₱300.00</Text>
          </View>

          <View style={styles.grindCard}>
            <View style={styles.grindHeader}>
              <Text style={styles.grindNumber}>GRD-0002</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.statusText, { color: '#92400E' }]}>
                  NOT STARTED
                </Text>
              </View>
            </View>
            <Text style={styles.grindInfo}>Jane Smith • MLBB</Text>
            <Text style={styles.grindInfo}>Master IV → Epic I</Text>
            <Text style={styles.grindInfo}>₱150.00</Text>
          </View>
        </View>

        {/* Recent Completions Section */}
        <Text style={styles.sectionTitle}>Recent Completions</Text>
        <Text style={styles.placeholder}>No completed grinds yet</Text>
      </ScrollView>

      <FloatingNav />
    </SafeAreaView>
  );
}
