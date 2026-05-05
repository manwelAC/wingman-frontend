import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface WalletBalanceProps {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastTransactionAt: string | null;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

/**
 * WalletBalance Component
 * Displays wallet overview: current balance, total earnings, withdrawals
 */
export function WalletBalance({
  balance,
  totalEarned,
  totalWithdrawn,
  lastTransactionAt,
  isLoading = false,
  onRefresh,
}: WalletBalanceProps) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No transactions';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading && balance === 0 && totalEarned === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      scrollEnabled={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ) : undefined
      }
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Main Balance Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: '#FFFFFF' }]}>
              Available Balance
            </Text>
            <Ionicons name="wallet" size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.balanceAmount, { color: '#FFFFFF' }]}>
            {formatCurrency(balance)}
          </Text>
          <Text style={[styles.lastTransaction, { color: '#FFFFFF', opacity: 0.8 }]}>
            Last transaction: {formatDate(lastTransactionAt)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Earned */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.statusSuccess + '15' }]}>
            <View style={styles.statHeader}>
              <Ionicons
                name="arrow-up-circle-outline"
                size={20}
                color={theme.colors.statusSuccess}
              />
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Total Earned
              </Text>
            </View>
            <Text style={[styles.statAmount, { color: theme.colors.statusSuccess }]}>
              {formatCurrency(Math.max(0, totalEarned || 0))}
            </Text>
          </View>

          {/* Total Withdrawn */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.statusDanger + '15' }]}>
            <View style={styles.statHeader}>
              <Ionicons
                name="arrow-down-circle-outline"
                size={20}
                color={theme.colors.statusDanger}
              />
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Withdrawn
              </Text>
            </View>
            <Text style={[styles.statAmount, { color: theme.colors.statusDanger }]}>
              {formatCurrency(Math.max(0, totalWithdrawn || 0))}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  mainCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'DMMono-Regular',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  lastTransaction: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  statAmount: {
    fontSize: 16,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
});
