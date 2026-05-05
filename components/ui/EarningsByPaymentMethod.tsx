import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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

const brandColorMap: Record<string, string> = {
  gcash: '#0432c5',
  maya: '#01b463',
  maribank: '#ea6004',
  unionbank: '#fc700c',
  bdo: '#014ea8',
  bpi: '#a42d31',
  eastwest: '#d6e24e',
};

interface PaymentMethodEarning {
  id: number;
  type_id: number;
  code: string;
  name: string;
  icon: string;
  logo_path?: string;
  category: string;
  total_earned: number;
  grind_count: number;
  last_earned_at: string | null;
}

interface EarningsByPaymentMethodProps {
  eWallet: PaymentMethodEarning[];
  bankTransfer: PaymentMethodEarning[];
  creditCard: PaymentMethodEarning[];
  isLoading?: boolean;
  onMethodPress?: (method: PaymentMethodEarning) => void;
}

const CATEGORY_LABELS = {
  e_wallet: 'E-Wallets',
  bank_transfer: 'Bank Transfers',
  credit_card: 'Credit Cards',
};

/**
 * EarningsByPaymentMethod Component
 * Displays earnings as cards, only showing methods the user has used
 */
export function EarningsByPaymentMethod({
  eWallet,
  bankTransfer,
  creditCard,
  isLoading = false,
  onMethodPress,
}: EarningsByPaymentMethodProps) {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No earnings';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;

      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const renderMethodCard = (method: PaymentMethodEarning) => (
    <LinearGradient
      key={method.id}
      colors={[
        brandColorMap[method.code] || theme.colors.primary,
        brandColorMap[method.code] || theme.colors.primary,
        '#FFFFFF',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientContainer}
    >
      <TouchableOpacity
        onPress={() => onMethodPress?.(method)}
        style={[
          styles.methodCard,
          { 
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.methodIcon,
              { backgroundColor: '#00000010' },
            ]}
          >
            {method.logo_path && logoMap[method.logo_path] ? (
              <Image
                source={logoMap[method.logo_path]}
                style={{ width: 32, height: 32, borderRadius: 8 }}
              />
            ) : (
              <Ionicons name={method.icon as any} size={24} color="#FFFFFF" />
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.methodName, { color: '#FFFFFF' }]}>
            {method.name}
          </Text>

          <Text style={[styles.earnAmount, { color: '#FFFFFF' }]}>
            {formatCurrency(method.total_earned)}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.methodStats, { color: '#FFFFFF' }]}>
              {method.grind_count} grind{method.grind_count !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.lastEarned, { color: '#000000' }]}>
              {formatDate(method.last_earned_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderCategory = (
    title: string,
    methods: PaymentMethodEarning[]
  ) => {
    // Display all methods passed to this component (already filtered at parent level)
    if (methods.length === 0) return null;

    return (
      <View key={title} style={styles.categorySection}>
        <Text
          style={[
            styles.categoryTitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          {title}
        </Text>
        <View style={styles.cardGrid}>
          {methods.map((method) => renderMethodCard(method))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show all available payment methods (don't filter by earnings)
  const hasAnyMethods =
    eWallet.length > 0 ||
    bankTransfer.length > 0 ||
    creditCard.length > 0;

  if (!hasAnyMethods) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="wallet-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No payment methods available
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
          Payment methods will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {eWallet.length > 0 && renderCategory(CATEGORY_LABELS.e_wallet, eWallet)}
      {bankTransfer.length > 0 && renderCategory(CATEGORY_LABELS.bank_transfer, bankTransfer)}
      {creditCard.length > 0 && renderCategory(CATEGORY_LABELS.credit_card, creditCard)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingHorizontal: 16,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 13,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardGrid: {
    gap: 12,
  },
  gradientContainer: {
    borderRadius: 12,
  },
  methodCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    gap: 8,
  },
  methodName: {
    fontSize: 15,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  earnAmount: {
    fontSize: 18,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodStats: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  lastEarned: {
    fontSize: 12,
    fontFamily: 'DMMono-Regular',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    marginHorizontal: 16,
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
