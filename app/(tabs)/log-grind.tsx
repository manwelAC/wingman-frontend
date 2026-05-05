import { Button } from '@/components/ui/Button';
import FloatingNav from '@/components/ui/FloatingNav';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { useTheme } from '@/constants/useTheme';
import { calculatorApi, customerApi, gameApi, grindApi, paymentMethodApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const GAMES = ['CODM', 'MLBB', 'Valorant'];
const SERVICE_TYPES = ['rank-boost', 'star-grind'];

interface Customer {
  id: number;
  display_name: string;
  email: string | null;
  phone: string | null;
}

interface GameRankTier {
  id: number;
  game: string;
  tier_name: string;
  tier_order: number;
  rank_group?: string;
  tier_number: number;
  stars_per_tier: number;
  is_active: boolean;
}

export default function LogGrindScreen() {
  const theme = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [gameTiers, setGameTiers] = useState<GameRankTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedGame, setSelectedGame] = useState('CODM');
  const [serviceType, setServiceType] = useState('rank-boost');
  const [startingTier, setStartingTier] = useState<GameRankTier | null>(null);
  const [targetTier, setTargetTier] = useState<GameRankTier | null>(null);
  const [accountUsername, setAccountUsername] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successGrindNumber, setSuccessGrindNumber] = useState('');
  const [successCustomerName, setSuccessCustomerName] = useState('');

  // Modal state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStartTierModal, setShowStartTierModal] = useState(false);
  const [showTargetTierModal, setShowTargetTierModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  // Load data on mount and when game changes
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadGameTiers();
  }, [selectedGame]);

  const loadInitialData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      // Load customers from cache first
      const cachedCustomers = await AsyncStorage.getItem('cachedCustomers');
      if (cachedCustomers) {
        setCustomers(JSON.parse(cachedCustomers));
      } else {
        setLoading(true);
      }

      // Load available payment methods from cache first
      const cachedAvailable = await AsyncStorage.getItem('cachedAvailableMethods');
      if (cachedAvailable) {
        setAvailableMethods(JSON.parse(cachedAvailable));
      }

      // Load payment methods from cache first
      const cachedPaymentMethods = await AsyncStorage.getItem('cachedPaymentMethods');
      if (cachedPaymentMethods) {
        const cached = JSON.parse(cachedPaymentMethods);
        const allMethods = [
          ...(cached.e_wallet || []),
          ...(cached.bank_transfer || []),
          ...(cached.credit_card || []),
        ];
        setPaymentMethods(allMethods);
        const activeMethod = allMethods.find((m: any) => m.is_active);
        if (activeMethod) {
          setSelectedPaymentMethod(activeMethod);
        }
      }

      // Fetch customers in background
      const customersRes = await customerApi.fetchCustomers(token);
      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data);
        await AsyncStorage.setItem('cachedCustomers', JSON.stringify(customersRes.data));
      }

      // Fetch available payment method types in background
      const availableRes = await paymentMethodApi.getAvailableMethods(token);
      if (availableRes.success && availableRes.data && availableRes.data.data) {
        const allAvailable = [
          ...(availableRes.data.data.e_wallet || []),
          ...(availableRes.data.data.bank_transfer || []),
          ...(availableRes.data.data.credit_card || []),
        ];
        setAvailableMethods(allAvailable);
        await AsyncStorage.setItem('cachedAvailableMethods', JSON.stringify(allAvailable));
      }

      // Fetch user's payment methods in background
      const paymentRes = await paymentMethodApi.getUserMethods(token);
      if (paymentRes.success && paymentRes.data && paymentRes.data.data) {
        const allMethods = [
          ...(paymentRes.data.data.e_wallet || []),
          ...(paymentRes.data.data.bank_transfer || []),
          ...(paymentRes.data.data.credit_card || []),
        ];
        setPaymentMethods(allMethods);
        await AsyncStorage.setItem('cachedPaymentMethods', JSON.stringify(allMethods));
        // Auto-select first active payment method
        const activeMethod = allMethods.find((m: any) => m.is_active);
        if (activeMethod) {
          setSelectedPaymentMethod(activeMethod);
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameTiers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      // Load game tiers from cache first
      const cacheKey = `cachedGameTiers_${selectedGame}`;
      const cachedTiers = await AsyncStorage.getItem(cacheKey);
      if (cachedTiers) {
        setGameTiers(JSON.parse(cachedTiers));
      } else {
        setLoading(true);
      }

      // Fetch game tiers in background
      const tiersRes = await gameApi.fetchRankTiers(selectedGame, token);
      if (tiersRes.success && tiersRes.data) {
        const sortedTiers = tiersRes.data.tiers.sort((a, b) => a.tier_order - b.tier_order);
        setGameTiers(sortedTiers);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(sortedTiers));
      }
    } catch (error) {
      console.error('Failed to load game tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (start: GameRankTier, target: GameRankTier) => {
    try {
      setCalculatingPrice(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await calculatorApi.calculateRankBoost(
        {
          game: selectedGame,
          service_type: serviceType,
          starting_tier_id: start.id,
          target_tier_id: target.id,
        },
        token
      );

      if (response.success && response.data) {
        setTotalPrice(response.data.base_price);
      }
    } catch (error) {
      console.error('Failed to calculate price:', error);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleGameChange = (game: string) => {
    setSelectedGame(game);
    setStartingTier(null);
    setTargetTier(null);
    setTotalPrice(0);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !startingTier || !targetTier || totalPrice === 0 || !selectedPaymentMethod) {
      alert('Please fill in all required fields and wait for price calculation');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const response = await grindApi.createGrind(
        {
          customer_id: selectedCustomer.id,
          game: selectedGame,
          service_type: serviceType.replace('-', '_'),
          starting_tier_id: startingTier.id,
          target_tier_id: targetTier.id,
          base_price: totalPrice,
          final_price: totalPrice,
          account_username: accountUsername,
          special_instructions: specialInstructions,
          payment_method_type_id: selectedPaymentMethod.payment_method_type_id || selectedPaymentMethod.id,
        },
        token
      );

      if (response.success) {
        // Store success info
        setSuccessGrindNumber(response.data?.grind_number || 'Grind');
        setSuccessCustomerName(selectedCustomer.display_name);
        setShowSuccessModal(true);
        
        // Reset form after showing success
        setTimeout(() => {
          setSelectedCustomer(null);
          setSelectedGame('CODM');
          setServiceType('rank-boost');
          setStartingTier(null);
          setTargetTier(null);
          setAccountUsername('');
          setSpecialInstructions('');
          setTotalPrice(0);
        }, 100);
      } else {
        alert(response.message || 'Failed to create grind');
      }
    } catch (error) {
      console.error('Error creating grind:', error);
      alert('Error creating grind');
    } finally {
      setSubmitting(false);
    }
  };

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
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    label: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    selector: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectorText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    selectorPlaceholder: {
      color: theme.colors.textSecondary,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      fontFamily: 'DMMono',
      fontSize: 14,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    gameTabsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      justifyContent: 'space-between',
    },
    gameTab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    activeGameTab: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    gameTabText: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
    },
    activeGameTabText: {
      color: '#FFFFFF',
    },
    tierGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tierButton: {
      flex: 1,
      minWidth: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    activeTierButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tierButtonText: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
    },
    activeTierButtonText: {
      color: '#FFFFFF',
    },
    priceSummary: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    priceLabel: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    priceValue: {
      fontSize: 14,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    buttonContainer: {
      marginTop: theme.spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: theme.spacing.lg,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 16,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    modalItem: {
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalItemText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: theme.spacing.lg, fontSize: 16, fontFamily: 'DMMono', fontWeight: 'bold', color: theme.colors.textPrimary }}>
            Switching to {selectedGame}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Log a Grind</Text>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Customer *</Text>
          <Pressable style={styles.selector} onPress={() => setShowCustomerModal(true)}>
            <Text style={[styles.selectorText, !selectedCustomer && styles.selectorPlaceholder]}>
              {selectedCustomer ? selectedCustomer.display_name : 'Select a customer'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Method *</Text>
          <Pressable style={styles.selector} onPress={() => setShowPaymentMethodModal(true)}>
            <Text style={[styles.selectorText, !selectedPaymentMethod && styles.selectorPlaceholder]}>
              {selectedPaymentMethod ? (() => {
                const methodType = availableMethods.find(m => m.id === selectedPaymentMethod.payment_method_type_id);
                return (
                  <View>
                    <Text style={styles.selectorText}>
                      {methodType?.name || 'Unknown'}
                    </Text>
                    {selectedPaymentMethod.account_holder_name && (
                      <Text style={[styles.label, { marginTop: 4 }]}>
                        {selectedPaymentMethod.account_holder_name}
                      </Text>
                    )}
                  </View>
                );
              })() : 'Select payment method'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Game Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Game *</Text>
          <View style={styles.gameTabsContainer}>
            {GAMES.map((game) => (
              <Pressable
                key={game}
                style={[styles.gameTab, selectedGame === game && styles.activeGameTab]}
                onPress={() => handleGameChange(game)}
              >
                <Text
                  style={[
                    styles.gameTabText,
                    selectedGame === game && styles.activeGameTabText,
                  ]}
                >
                  {game}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Service Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Service Type *</Text>
          <View style={styles.gameTabsContainer}>
            {SERVICE_TYPES.filter((type) => {
              // star-grind only for MLBB
              if (type === 'star-grind') {
                return selectedGame === 'MLBB';
              }
              return true;
            }).map((type) => (
              <Pressable
                key={type}
                style={[styles.gameTab, serviceType === type && styles.activeGameTab]}
                onPress={() => setServiceType(type)}
              >
                <Text
                  style={[
                    styles.gameTabText,
                    serviceType === type && styles.activeGameTabText,
                  ]}
                >
                  {type.replace('-', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Starting Tier Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Starting Tier *</Text>
          <Pressable style={styles.selector} onPress={() => setShowStartTierModal(true)}>
            <Text style={[styles.selectorText, !startingTier && styles.selectorPlaceholder]}>
              {startingTier ? startingTier.tier_name : 'Select starting tier'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Target Tier Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Target Tier *</Text>
          <Pressable style={styles.selector} onPress={() => setShowTargetTierModal(true)}>
            <Text style={[styles.selectorText, !targetTier && styles.selectorPlaceholder]}>
              {targetTier ? targetTier.tier_name : 'Select target tier'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>



        {/* Account Username */}
        <View style={styles.section}>
          <Text style={styles.label}>Account Username / Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account username or email"
            placeholderTextColor={theme.colors.textSecondary}
            value={accountUsername}
            onChangeText={setAccountUsername}
          />
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.label}>Special Instructions</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholder="Enter any special instructions..."
            placeholderTextColor={theme.colors.textSecondary}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
          />
        </View>

        {/* Price Summary */}
        {startingTier && targetTier && (
          <View style={[styles.priceSummary, calculatingPrice && { opacity: 0.7 }]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tiers:</Text>
              <Text style={styles.priceValue}>
                {startingTier?.tier_name} → {targetTier?.tier_name}
              </Text>
            </View>
            <View style={[styles.priceRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, marginTop: 8 }]}>
              <Text style={[styles.priceLabel, { fontWeight: 'bold' }]}>Total Price:</Text>
              {calculatingPrice ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.priceValue, { fontSize: 16 }]}>Calculating...</Text>
                </View>
              ) : (
                <Text style={[styles.priceValue, { fontSize: 16 }]}>₱{totalPrice.toFixed(2)}</Text>
              )}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            label={submitting ? 'Logging Grind...' : 'Log Grind'}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            disabled={submitting || !selectedCustomer || !startingTier || !targetTier || totalPrice === 0 || calculatingPrice || !selectedPaymentMethod}
          />
        </View>
      </ScrollView>

      {/* Customer Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            {customers.map((customer) => (
              <Pressable
                key={customer.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{customer.display_name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Starting Tier Modal */}
      <Modal
        visible={showStartTierModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowStartTierModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
            <Text style={styles.modalTitle}>Select Starting Tier</Text>
            {gameTiers.map((tier) => (
              <Pressable
                key={tier.id}
                style={styles.modalItem}
                onPress={() => {
                  setStartingTier(tier);
                  setShowStartTierModal(false);
                  // Clear target if it's lower than starting
                  if (targetTier && targetTier.tier_order <= tier.tier_order) {
                    setTargetTier(null);
                  }
                }}
              >
                <Text style={styles.modalItemText}>{tier.tier_name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Target Tier Modal */}
      <Modal
        visible={showTargetTierModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTargetTierModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
            <Text style={styles.modalTitle}>Select Target Tier</Text>
            {gameTiers
              .filter((tier) => !startingTier || tier.tier_order > startingTier.tier_order)
              .map((tier) => (
                <Pressable
                  key={tier.id}
                  style={styles.modalItem}
                  onPress={async () => {
                    setTargetTier(tier);
                    setShowTargetTierModal(false);
                    // Auto-calculate price when both tiers are set
                    if (startingTier) {
                      await calculatePrice(startingTier, tier);
                    }
                  }}
                >
                  <Text style={styles.modalItemText}>{tier.tier_name}</Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            {paymentMethods.length === 0 ? (
              <Text style={[styles.modalItemText, { textAlign: 'center', padding: theme.spacing.lg, color: theme.colors.textSecondary }]}>
                No payment methods available. Please add one in your profile.
              </Text>
            ) : (
              paymentMethods.map((method) => {
                const methodType = availableMethods.find(m => m.id === method.payment_method_type_id);
                return (
                  <Pressable
                    key={method.id}
                    style={[styles.modalItem, !method.is_active && { opacity: 0.5 }]}
                    onPress={() => {
                      if (method.is_active) {
                        setSelectedPaymentMethod(method);
                        setShowPaymentMethodModal(false);
                      }
                    }}
                    disabled={!method.is_active}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalItemText}>{methodType?.name || 'Unknown'}</Text>
                        {method.account_holder_name && (
                          <Text style={[styles.modalItemText, { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }]}>
                            {method.account_holder_name}
                          </Text>
                        )}
                      </View>
                      {!method.is_active && (
                        <Text style={{ fontSize: 10, color: theme.colors.statusDanger, fontWeight: 'bold' }}>Disabled</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        title="Grind Logged!"
        message={`Successfully created grind ${successGrindNumber} for ${successCustomerName}`}
        onDismiss={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDuration={2500}
      />

      <FloatingNav />
    </SafeAreaView>
  );
}
