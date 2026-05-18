import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';

interface PaymentMethod {
  id: number;
  payment_method_type_id: number;
  name: string;
  [key: string]: any;
}

interface PaymentMethodCarouselProps {
  methods: PaymentMethod[];
  availableMethods: any[];
  onSelect: (methodId: string, methodName: string) => void;
  loading?: boolean;
}

const CARD_WIDTH = Dimensions.get('window').width - 64; // Accounting for padding
const CARD_HEIGHT = 140;

export default function PaymentMethodCarousel({
  methods,
  availableMethods,
  onSelect,
  loading = false,
}: PaymentMethodCarouselProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const flatListRef = useRef<FlatList>(null);

  // Get payment method type name from ID
  const getMethodTypeName = (typeId: number) => {
    return availableMethods.find((m) => m.id === typeId)?.name || 'Payment Method';
  };

  // Get icon based on payment method type
  const getMethodIcon = (typeId: number) => {
    const typeName = getMethodTypeName(typeId);
    const iconMap: Record<string, string> = {
      'E-Wallet': 'wallet-outline',
      'Bank Transfer': 'swap-horizontal-outline',
      'Credit Card': 'card-outline',
    };
    return iconMap[typeName] || 'wallet-outline';
  };

  const renderCard = ({ item }: { item: PaymentMethod }) => {
    const methodTypeName = getMethodTypeName(item.payment_method_type_id);
    const icon = getMethodIcon(item.payment_method_type_id);

    return (
      <View style={styles.cardWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: primaryColor,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => onSelect(item.id.toString(), methodTypeName)}
          disabled={loading}
        >
          {/* Icon Background */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: primaryColor + '20', // 20% opacity
              },
            ]}
          >
            <Ionicons name={icon as any} size={32} color={primaryColor} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.methodName,
                {
                  color: theme.colors.textPrimary,
                },
              ]}
              numberOfLines={1}
            >
              {methodTypeName}
            </Text>

            {/* Tap indicator */}
            <View style={styles.tapIndicator}>
              <Text
                style={[
                  styles.tapText,
                  {
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Tap to select →
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  if (!methods || methods.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={[
            styles.emptyText,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          No payment methods available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={methods}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={CARD_WIDTH + 16} // Card width + gap
        contentContainerStyle={styles.listContent}
      />

      {/* Indicator dots */}
      {methods.length > 1 && (
        <View style={styles.dotsContainer}>
          {methods.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === 0 ? primaryColor : theme.colors.textSecondary + '40',
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  listContent: {
    paddingHorizontal: 32, // 16px on each side
    gap: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  methodName: {
    fontSize: 16,
    fontFamily: 'DMMono-Medium',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapText: {
    fontSize: 11,
    fontFamily: 'DMMono',
    marginRight: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMMono',
  },
});
