import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { grindApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Grind {
  id: number;
  grind_number: string;
  customer_id: number;
  game: string;
  service_type: string;
  status: string;
  progress_percentage: number;
  base_price: string;
  final_price: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  customer: {
    id: number;
    display_name: string;
  };
  created_at: string;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [grinds, setGrinds] = useState<Grind[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadGrinds();
    }, [])
  );

  const loadGrinds = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await grindApi.fetchGrinds(token);
      if (response.success && response.data) {
        setGrinds(response.data);
      }
    } catch (error) {
      console.error('Failed to load grinds:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGrinds();
    setRefreshing(false);
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = grinds.length;
    const completed = grinds.filter((g) => g.status === 'completed').length;
    const active = grinds.filter((g) => g.status === 'in_progress').length;
    const totalEarned = grinds
      .filter((g) => g.status === 'completed')
      .reduce((sum, g) => sum + parseFloat(g.final_price || g.base_price || '0'), 0);

    return { total, completed, active, totalEarned };
  }, [grinds]);

  // Get active grinds (first 5)
  const activeGrinds = React.useMemo(
    () => grinds.filter((g) => g.status === 'in_progress').slice(0, 5),
    [grinds]
  );

  // Get recent completions (first 5)
  const recentCompletions = React.useMemo(
    () =>
      grinds
        .filter((g) => g.status === 'completed')
        .sort((a, b) => {
          const dateA = new Date(a.completed_at || 0).getTime();
          const dateB = new Date(b.completed_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5),
    [grinds]
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return theme.colors.statusSuccess;
      case 'in_progress':
        return theme.colors.primary;
      case 'not_started':
        return theme.colors.textSecondary;
      case 'cancelled':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
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
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    greetingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    greeting: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    profileButton: {
      width: 44,
      height: 44,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: 120,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
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
      minHeight: 110,
    },
    statCardPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    statValue: {
      fontSize: 28,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statValueLight: {
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 11,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    statLabelLight: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    statIcon: {
      marginBottom: theme.spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    viewAllButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '15',
    },
    viewAllText: {
      fontSize: 11,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    grindCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    activeGrindRow: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    grindCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    grindNumber: {
      fontSize: 13,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: theme.colors.primary + '20',
    },
    statusText: {
      fontSize: 10,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    customerName: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    activeGrindInfo: {
      flex: 1,
      flexDirection: 'column',
    },
    activeGrindHeader: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
      marginBottom: 4,
    },
    activeGrindTitle: {
      fontSize: 12,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    activeGrindGame: {
      fontSize: 11,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    activeGrindPrice: {
      fontSize: 12,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    grindDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    grindDetail: {
      flex: 1,
    },
    grindDetailLabel: {
      fontSize: 10,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    grindDetailValue: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    priceRow: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: 10,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    priceValue: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Welcome back, Pilot</Text>
          <Pressable
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={22} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && grinds.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {/* Total Grinds */}
              <View style={styles.statCard}>
                <Ionicons
                  name="game-controller-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Grinds</Text>
              </View>

              {/* Active */}
              <View style={styles.statCard}>
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>

            {/* Completed Card */}
            <View style={[styles.statCard, { marginBottom: theme.spacing.lg }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={theme.colors.statusSuccess}
                style={styles.statIcon}
              />
              <Text style={[styles.statValue, { color: theme.colors.statusSuccess }]}>
                {stats.completed}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            {/* Total Earned Card */}
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <Ionicons
                name="wallet-outline"
                size={24}
                color="#FFFFFF"
                style={styles.statIcon}
              />
              <Text style={[styles.statValue, styles.statValueLight]}>
                ₱{stats.totalEarned.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelLight]}>Total Earned</Text>
            </View>

            {/* Active Grinds Section */}
            {activeGrinds.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Grinds</Text>
                  <Pressable 
                    style={styles.viewAllButton}
                    onPress={() => router.push('/(tabs)/grinds')}
                  >
                    <Text style={styles.viewAllText}>View all →</Text>
                  </Pressable>
                </View>

                {activeGrinds.map((grind) => (
                  <View key={grind.id} style={styles.activeGrindRow}>
                    <View style={styles.activeGrindInfo}>
                      <View style={styles.activeGrindHeader}>
                        <Text style={styles.activeGrindTitle}>{grind.grind_number}</Text>
                        <Text style={styles.activeGrindGame}>{grind.customer.display_name}</Text>
                      </View>
                      <Text style={styles.activeGrindGame}>{grind.game}</Text>
                    </View>
                    <Text style={styles.activeGrindPrice}>₱{parseFloat(grind.base_price).toFixed(2)}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Recent Completions Section */}
            {recentCompletions.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Completions</Text>
                  <Pressable 
                    style={styles.viewAllButton}
                    onPress={() => router.push('/(tabs)/grinds')}
                  >
                    <Text style={styles.viewAllText}>View all →</Text>
                  </Pressable>
                </View>

                {recentCompletions.map((grind) => (
                  <View key={grind.id} style={styles.grindCard}>
                    <View style={styles.grindCardHeader}>
                      <Text style={styles.grindNumber}>{grind.grind_number}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: theme.colors.statusSuccess + '20' }]}>
                        <Text style={[styles.statusText, { color: theme.colors.statusSuccess }]}>
                          COMPLETED
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.customerName}>{grind.customer.display_name}</Text>

                    <View style={styles.grindDetails}>
                      <View style={styles.grindDetail}>
                        <Text style={styles.grindDetailLabel}>Game</Text>
                        <Text style={styles.grindDetailValue}>{grind.game}</Text>
                      </View>
                      <View style={styles.grindDetail}>
                        <Text style={styles.grindDetailLabel}>Finished</Text>
                        <Text style={styles.grindDetailValue}>{formatDate(grind.completed_at)}</Text>
                      </View>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Final Price</Text>
                      <Text style={styles.priceValue}>₱{parseFloat(grind.final_price).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Empty State */}
            {grinds.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="game-controller-outline"
                  size={48}
                  color={theme.colors.textSecondary}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>No grinds yet. Start by logging a new grind!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <FloatingNav />
    </SafeAreaView>
  );
}
