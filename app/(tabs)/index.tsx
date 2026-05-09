import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { grindApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme,
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
  due_date: string | null;
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
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const [grinds, setGrinds] = useState<Grind[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load grinds only on initial mount
  useEffect(() => {
    loadGrinds();
  }, []);

  const loadGrinds = async () => {
    try {
      // Try to load from cache first
      const cachedGrinds = await AsyncStorage.getItem('cachedGrinds');
      if (cachedGrinds) {
        setGrinds(JSON.parse(cachedGrinds));
        // Don't show loading spinner if we have cached data
      } else {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No token found');
        return;
      }

      const response = await grindApi.fetchGrinds(token);
      if (response.success && response.data) {
        setGrinds(response.data);
        // Cache the grinds data
        await AsyncStorage.setItem('cachedGrinds', JSON.stringify(response.data));
      }
    } catch (error) {
      console.warn('Failed to load grinds:', error);
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
    const cancelled = grinds.filter((g) => g.status === 'cancelled').length;
    const totalEarned = grinds
      .filter((g) => g.status === 'completed')
      .reduce((sum, g) => sum + parseFloat(g.final_price || g.base_price || '0'), 0);

    return { total, completed, active, cancelled, totalEarned };
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

  // Calculate completion rate by month
  const monthlyStats = React.useMemo(() => {
    const monthMap: Record<string, { total: number; completed: number }> = {};
    
    grinds.forEach((grind) => {
      const date = new Date(grind.created_at);
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { total: 0, completed: 0 };
      }
      
      monthMap[monthKey].total += 1;
      if (grind.status === 'completed') {
        monthMap[monthKey].completed += 1;
      }
    });

    // Convert to array and get last 6 months
    return Object.entries(monthMap)
      .map(([month, { total, completed }]) => ({
        month,
        total,
        completed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }))
      .slice(-6);
  }, [grinds]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return theme.colors.statusSuccess;
      case 'in_progress':
        return primaryColor;
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
      paddingVertical: theme.spacing.xl,
    },
    profileButton: {
      width: 44,
      height: 44,
      borderRadius: 50,
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
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    statCardPrimary: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    statValue: {
      fontSize: 44,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 1, height: 2 },
      textShadowRadius: 4,
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
      backgroundColor: primaryColor + '15',
    },
    viewAllText: {
      fontSize: 11,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: primaryColor,
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
      color: primaryColor,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: primaryColor + '20',
    },
    statusText: {
      fontSize: 10,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: primaryColor,
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
      color: primaryColor,
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
      color: primaryColor,
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
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back, Pilot</Text>
            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={22} color={primaryColor} />
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
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {/* Total Grinds */}
              <View style={[styles.statCard, { position: 'relative', overflow: 'hidden' }]}>
                <Ionicons
                  name="game-controller-outline"
                  size={80}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  style={{
                    position: 'absolute',
                    opacity: 0.1,
                    top: -10,
                    right: -10,
                  }}
                />
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Grinds</Text>
              </View>

              {/* Active */}
              <View style={[styles.statCard, { position: 'relative', overflow: 'hidden' }]}>
                <Ionicons
                  name="flash-outline"
                  size={80}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  style={{
                    position: 'absolute',
                    opacity: 0.1,
                    top: -10,
                    right: -10,
                  }}
                />
                <Text style={styles.statValue}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>

            {/* Completed and Cancelled Row */}
            <View style={styles.statsGrid}>
              {/* Completed Card */}
              <View style={[styles.statCard, { position: 'relative', overflow: 'hidden' }]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={120}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  style={{
                    position: 'absolute',
                    opacity: 0.1,
                    top: -30,
                    right: -30,
                  }}
                />
                <Text style={[styles.statValue, { color: theme.colors.statusSuccess }]}>
                  {stats.completed}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              {/* Cancelled Card */}
              <View style={[styles.statCard, { position: 'relative', overflow: 'hidden' }]}>
                <Ionicons
                  name="close-circle-outline"
                  size={120}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                  style={{
                    position: 'absolute',
                    opacity: 0.1,
                    top: -30,
                    right: -30,
                  }}
                />
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {stats.cancelled}
                </Text>
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
            </View>

            {/* Total Earned Card */}
            <Pressable style={{ marginBottom: theme.spacing.lg }} onPress={() => router.push('/(tabs)/wallet')}>
              <LinearGradient
                colors={['#22c55e', '#22c55e', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <View style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 110,
                }}>
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
              </LinearGradient>
            </Pressable>

            {/* Completion Rate Card */}
            <View style={[styles.statCard, { marginBottom: theme.spacing.lg }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: theme.spacing.md }}>
                <View>
                  <Text style={[styles.statLabel, { marginBottom: theme.spacing.sm }]}>Completion Rate</Text>
                  <Text style={[styles.statValue, { fontSize: 24, color: primaryColor }]}>
                    {grinds.length > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </Text>
                </View>
                <Ionicons name="trending-up" size={28} color={theme.colors.statusSuccess} />
              </View>
              
              {/* Monthly chart */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 60, marginTop: theme.spacing.md }}>
                {monthlyStats.map((stat, index) => {
                  const maxRate = Math.max(...monthlyStats.map(s => s.rate), 1);
                  const barHeight = (stat.rate / maxRate) * 50;
                  return (
                    <View key={index} style={{ alignItems: 'center', gap: 4 }}>
                      <View
                        style={{
                          width: 6,
                          height: barHeight,
                          backgroundColor: primaryColor,
                          borderRadius: 3,
                        }}
                      />
                      <Text style={[styles.grindDetailLabel, { fontSize: 9 }]}>
                        {stat.month.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
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
    </View>
  );
}
