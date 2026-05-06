import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface GrindTransaction {
  id: number;
  grind_number: string;
  game: string;
  service_type: 'rank_boost' | 'win_count';
  starting_tier: string | null;
  target_tier: string | null;
  target_stars: number | null;
  final_price: number;
  completed_at: string;
}

interface EarningsTimelineProps {
  grinds: GrindTransaction[];
  paymentMethodName: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onGrindPress?: (grind: GrindTransaction) => void;
}

const GAME_ICONS: Record<string, string> = {
  Valorant: 'shield-outline',
  MLBB: 'star-outline',
  CODM: 'crosshair-outline',
};

/**
 * EarningsTimeline Component
 * Displays paginated timeline of grinds for a specific payment method
 */
export function EarningsTimeline({
  grinds,
  paymentMethodName,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onGrindPress,
}: EarningsTimelineProps) {
  const theme = useTheme();
  const [loadingMore, setLoadingMore] = React.useState(false);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !onLoadMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getTierLabel = (grind: GrindTransaction): string => {
    if (grind.service_type === 'rank_boost') {
      if (grind.starting_tier && grind.target_tier) {
        return `${grind.starting_tier} → ${grind.target_tier}`;
      }
      return 'Rank Boost';
    } else if (grind.service_type === 'win_count') {
      return `${grind.target_stars} wins`;
    }
    return 'Unknown';
  };

  const renderGrindItem = ({ item }: { item: GrindTransaction }) => (
    <TouchableOpacity
      onPress={() => onGrindPress?.(item)}
      activeOpacity={0.7}
      style={[
        styles.grindItem,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.grindHeader}>
        <View style={styles.grindLeft}>
          <View
            style={[
              styles.gameIcon,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Ionicons
              name={(GAME_ICONS[item.game] || 'gaming-outline') as any}
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.grindInfo}>
            <Text style={[styles.grindNumber, { color: theme.colors.textSecondary }]}>
              {item.grind_number}
            </Text>
            <Text style={[styles.gameName, { color: theme.colors.textPrimary }]}>
              {item.game}
            </Text>
          </View>
        </View>
        <View style={styles.grindRight}>
          <Text style={[styles.earnAmount, { color: theme.colors.statusSuccess }]}>
            +{formatCurrency(item.final_price)}
          </Text>
        </View>
      </View>

      <View style={styles.grindDetails}>
        <View style={styles.detail}>
          <Ionicons name="list-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {item.service_type === 'rank_boost' ? 'Rank Boost' : 'Win Count'}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="podium-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {getTierLabel(item)}
          </Text>
        </View>
        <View style={styles.detail}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.completed_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity
        onPress={handleLoadMore}
        disabled={loadingMore}
        style={[
          styles.loadMoreButton,
          { backgroundColor: theme.colors.primary + '15' },
        ]}
      >
        {loadingMore ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : (
          <>
            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
            <Text style={[styles.loadMoreText, { color: theme.colors.primary }]}>
              Load More
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
      <Ionicons name="calendar-clear-outline" size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No earnings yet
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
        Complete grinds using {paymentMethodName} to see them here
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={grinds}
      renderItem={renderGrindItem}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  grindItem: {
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  grindHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  grindLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grindInfo: {
    flex: 1,
  },
  grindNumber: {
    fontSize: 11,
    fontFamily: 'DMMono-Regular',
    textTransform: 'uppercase',
  },
  gameName: {
    fontSize: 14,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
    marginTop: 2,
  },
  grindRight: {
    alignItems: 'flex-end',
  },
  earnAmount: {
    fontSize: 16,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  grindDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  loadMoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'DMMono-Regular',
    textAlign: 'center',
  },
});
