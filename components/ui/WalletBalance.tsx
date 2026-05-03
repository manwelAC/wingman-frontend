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
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
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
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        {/* Main Balance Card */}
        <View style={[styles.mainCard, { borderColor: theme.colors.primary }]}>
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: theme.colors.textSecondary }]}>
              Available Balance
            </Text>
            <Ionicons name="wallet" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.balanceAmount, { color: theme.colors.textPrimary }]}>
            {formatCurrency(balance)}
          </Text>
          <Text style={[styles.lastTransaction, { color: theme.colors.textSecondary }]}>
            Last transaction: {formatDate(lastTransactionAt)}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Earned */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
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
          <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
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

        {/* Net Position */}
        <View
          style={[
            styles.netCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={[styles.netLabel, { color: theme.colors.textSecondary }]}>
            Net Position
          </Text>
          <Text
            style={[
              styles.netAmount,
              {
                color: (totalEarned || 0) - (totalWithdrawn || 0) >= 0 ? theme.colors.statusSuccess : theme.colors.statusDanger,
              },
            ]}
          >
            {formatCurrency(Math.max(0, (totalEarned || 0) - (totalWithdrawn || 0)))}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  mainCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'DMMono-Regular',
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  lastTransaction: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
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
  netCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  netLabel: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  netAmount: {
    fontSize: 20,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
});
