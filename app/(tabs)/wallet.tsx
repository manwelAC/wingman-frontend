import { EarningsByPaymentMethod } from '@/components/ui/EarningsByPaymentMethod';
import { EarningsTimeline } from '@/components/ui/EarningsTimeline';
import { WalletBalance } from '@/components/ui/WalletBalance';
import { useTheme } from '@/constants/useTheme';
import { paymentMethodApi, walletApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface WalletSummary {
  wallet_id: number;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  pending_amount: number;
  last_transaction_at: string | null;
}

interface PaymentMethodEarning {
  id: number;
  type_id: number;
  code: string;
  name: string;
  icon: string;
  category: string;
  total_earned: number;
  grind_count: number;
  last_earned_at: string | null;
}

interface TimelineGrind {
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

/**
 * Wallet Screen
 * Main wallet dashboard showing balance, earnings by payment method, and transaction timeline
 */
export default function WalletScreen() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [earningsByMethod, setEarningsByMethod] = useState<{
    e_wallet: PaymentMethodEarning[];
    bank_transfer: PaymentMethodEarning[];
    credit_card: PaymentMethodEarning[];
  }>({
    e_wallet: [],
    bank_transfer: [],
    credit_card: [],
  });
  const [userPaymentMethodIds, setUserPaymentMethodIds] = useState<number[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodEarning | null>(null);
  const [timelineGrinds, setTimelineGrinds] = useState<TimelineGrind[]>([]);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineHasMore, setTimelineHasMore] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      let userMethodIds: number[] = [];

      // Load user's payment methods first
      const userMethodsRes = await paymentMethodApi.getUserMethods(token);
      if (userMethodsRes.success && userMethodsRes.data) {
        const userData = (userMethodsRes.data as any).data || userMethodsRes.data;
        userMethodIds = [
          ...(userData.e_wallet || []),
          ...(userData.bank_transfer || []),
          ...(userData.credit_card || []),
        ].map((m: any) => m.payment_method_type_id);
        setUserPaymentMethodIds(userMethodIds);
      }

      // Load wallet summary
      const summaryRes = await walletApi.getWalletSummary(token);
      if (summaryRes.success && summaryRes.data) {
        // Backend wraps response in 'data' field, extract it
        const walletData = (summaryRes.data as any).data || summaryRes.data;
        setWalletSummary(walletData);
      } else {
        setError(summaryRes.message || 'Failed to load wallet');
      }

      // Load earnings by payment method
      const earningsRes = await walletApi.getEarningsByPaymentMethod(token);
      if (earningsRes.success && earningsRes.data) {
        // Backend wraps response in 'data' field, extract it
        const responseData = (earningsRes.data as any).data || earningsRes.data;
        const allEarnings = responseData.earnings_by_method || {
          e_wallet: [],
          bank_transfer: [],
          credit_card: [],
        };

        // Filter to only show payment methods the user has configured
        setEarningsByMethod({
          e_wallet: allEarnings.e_wallet.filter((m: PaymentMethodEarning) =>
            userMethodIds.includes(m.type_id)
          ),
          bank_transfer: allEarnings.bank_transfer.filter((m: PaymentMethodEarning) =>
            userMethodIds.includes(m.type_id)
          ),
          credit_card: allEarnings.credit_card.filter((m: PaymentMethodEarning) =>
            userMethodIds.includes(m.type_id)
          ),
        });
      } else {
        setError(earningsRes.message || 'Failed to load earnings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTimelineGrinds = useCallback(
    async (page: number = 1) => {
      if (!selectedMethod) return;

      try {
        setTimelineLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }

        const res = await walletApi.getEarningsTimeline(
          token,
          selectedMethod.type_id,
          page,
          20
        );

        if (res.success && res.data) {
          // Backend wraps response in 'data' field, extract it
          const timelineData = (res.data as any).data || res.data;
          const timeline = Array.isArray(timelineData.timeline)
            ? timelineData.timeline
            : timelineData.earnings || timelineData.grinds || [];
          const pagination = timelineData.pagination || { last_page: 1 };

          if (timeline && timeline.length > 0) {
            if (page === 1) {
              setTimelineGrinds(timeline);
            } else {
              setTimelineGrinds((prev) => [...prev, ...timeline]);
            }
            setTimelineHasMore(page < (pagination.last_page || 1));
          } else if (page === 1) {
            setTimelineGrinds([]);
            setTimelineHasMore(false);
          }
          setTimelinePage(page);
        } else {
          setError(res.message || 'Failed to load timeline');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setTimelineLoading(false);
      }
    },
    [selectedMethod]
  );

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  useEffect(() => {
    if (showTimelineModal && selectedMethod) {
      loadTimelineGrinds(1);
    }
  }, [showTimelineModal, selectedMethod, loadTimelineGrinds]);

  const handleMethodPress = (method: PaymentMethodEarning) => {
    setSelectedMethod(method);
    setTimelinePage(1);
    setTimelineGrinds([]);
    setShowTimelineModal(true);
  };

  const handleLoadMoreTimeline = async () => {
    if (selectedMethod) {
      await loadTimelineGrinds(timelinePage + 1);
    }
  };

  if (isLoading && !walletSummary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Wallet</Text>
          <TouchableOpacity onPress={loadWalletData}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: theme.colors.statusDanger + '15' },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={theme.colors.statusDanger} />
            <Text style={[styles.errorText, { color: theme.colors.statusDanger }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Wallet Balance Card */}
        {walletSummary && (
          <View style={styles.section}>
            <WalletBalance
              balance={walletSummary.balance}
              totalEarned={walletSummary.total_earned}
              totalWithdrawn={walletSummary.total_withdrawn}
              lastTransactionAt={walletSummary.last_transaction_at}
              isLoading={isLoading}
              onRefresh={loadWalletData}
            />
          </View>
        )}

        {/* Earnings by Payment Method */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Earnings by Payment Method
          </Text>
          <EarningsByPaymentMethod
            eWallet={earningsByMethod?.e_wallet || []}
            bankTransfer={earningsByMethod?.bank_transfer || []}
            creditCard={earningsByMethod?.credit_card || []}
            isLoading={isLoading}
            onMethodPress={handleMethodPress}
          />
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.colors.primary + '10' },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.infoText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Earnings are recorded when you complete a grind. Click a payment method to see all grinds.
          </Text>
        </View>
      </ScrollView>

      {/* Timeline Modal */}
      <Modal
        visible={showTimelineModal}
        animationType="slide"
        onRequestClose={() => setShowTimelineModal(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity onPress={() => setShowTimelineModal(false)}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                {selectedMethod?.name} Earnings
              </Text>
              <Text
                style={[
                  styles.modalSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {selectedMethod?.grind_count} grind{selectedMethod?.grind_count !== 1 ? 's' : ''} • PHP{' '}
                {selectedMethod?.total_earned.toLocaleString('en-PH')}
              </Text>
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* Error Banner in Modal */}
          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.statusDanger + '15', marginTop: 0 },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={theme.colors.statusDanger} />
              <Text style={[styles.errorText, { color: theme.colors.statusDanger }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Modal Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedMethod && (
              <EarningsTimeline
                grinds={timelineGrinds}
                paymentMethodName={selectedMethod.name}
                isLoading={timelineLoading && timelinePage === 1}
                hasMore={timelineHasMore}
                onLoadMore={handleLoadMoreTimeline}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMMono-Regular',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMMono-Regular',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
    marginTop: 4,
  },
  modalContent: {
    flex: 1,
    paddingVertical: 16,
  },
});
