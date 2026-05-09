import { useTheme } from '@/constants/useTheme';
import { gameApi, pricingApi } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';

interface RankTier {
  id: number;
  game: string;
  tier_name: string;
  tier_order: number;
  rank_group?: string;
  tier_number: number;
  stars_per_tier: number;
  is_active: boolean;
}

interface AddPricingRangeModalProps {
  visible: boolean;
  game: string;
  editingPricing?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPricingRangeModal({
  visible,
  game,
  editingPricing = null,
  onClose,
  onSuccess,
}: AddPricingRangeModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [ranks, setRanks] = useState<RankTier[]>([]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  const [formData, setFormData] = useState({
    rangeName: '',
    startTier: null as RankTier | null,
    endTier: null as RankTier | null,
    price: '', // Generic price field - can be per tier (CODM/Valorant) or per star (MLBB)
    majorRankFee: '',
  });

  const [totalStars, setTotalStars] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [tiersLoading, setTiersLoading] = useState(false);

  // Reset form and cached tiers when game changes
  useEffect(() => {
    setFormData({
      rangeName: '',
      startTier: null,
      endTier: null,
      price: '',
      majorRankFee: '',
    });
    setRanks([]); // Clear cached tiers when game changes
    setShowStartDropdown(false);
    setShowEndDropdown(false);
    setTotalStars(0);
    setTotalCost(0);
  }, [game]);

  // Pre-populate form when editing
  useEffect(() => {
    if (visible && editingPricing) {
      // Fetch tiers first to populate the tier objects
      const initializeEdit = async () => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const tiersResponse = await gameApi.fetchRankTiers(game, token);
          if (tiersResponse.success && tiersResponse.data?.tiers) {
            const allTiers = tiersResponse.data.tiers;
            const startTier = allTiers.find((t: RankTier) => t.id === editingPricing.tier_start_id);
            const endTier = allTiers.find((t: RankTier) => t.id === editingPricing.tier_end_id);
            
            setRanks(allTiers);
            setFormData({
              rangeName: editingPricing.range_name,
              startTier: startTier || null,
              endTier: endTier || null,
              price: editingPricing.price_per_star,
              majorRankFee: editingPricing.major_rank_crossing_fee,
            });
          }
        }
      };
      initializeEdit();
    }
  }, [visible, editingPricing, game]);

  const handleStartDropdownPress = async () => {
    if (!showStartDropdown && ranks.length === 0) {
      // First time opening dropdown - fetch tiers
      const token = await AsyncStorage.getItem('authToken');
      console.log('Checking token before fetch:', token ? 'exists' : 'NOT FOUND');
      
      if (!token) {
        alert('⚠️  You must be logged in to set pricing. Please log in first.');
        return;
      }
      
      await fetchRankTiers();
    }
    setShowStartDropdown(!showStartDropdown);
  };

  // Calculate total cost when selections change
  useEffect(() => {
    if (formData.startTier && formData.endTier && formData.price) {
      const startOrder = formData.startTier.tier_order;
      const endOrder = formData.endTier.tier_order;
      const isMlbb = game === 'MLBB';

      // Make sure end is greater than start (not equal, since we count transitions)
      if (endOrder > startOrder) {
        const priceValue = parseFloat(formData.price) || 0;
        const fee = parseFloat(formData.majorRankFee) || 0;
        
        if (isMlbb) {
          // MLBB: Sum stars of all tiers being boosted TO (excluding start tier)
          let totalStars = 0;
          for (let i = startOrder + 1; i <= endOrder; i++) {
            const tier = ranks.find((r) => r.tier_order === i);
            if (tier) {
              totalStars += tier.stars_per_tier;
            }
          }
          const total = totalStars * priceValue + fee;
          setTotalStars(totalStars);
          setTotalCost(total);
        } else {
          // CODM/Valorant: Count number of transitions (boosts)
          const tierCount = endOrder - startOrder;
          const total = tierCount * priceValue + fee;
          setTotalStars(tierCount);
          setTotalCost(total);
        }
      }
    }
  }, [formData.startTier, formData.endTier, formData.price, formData.majorRankFee, ranks, game]);

  const fetchRankTiers = async () => {
    try {
      setTiersLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      console.log('Auth token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setTiersLoading(false);
        return;
      }
      const response = await gameApi.fetchRankTiers(game, token);
      if (response.success && response.data?.tiers) {
        setRanks(response.data.tiers);
      } else {
        alert('Failed to fetch rank tiers: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to fetch rank tiers:', error);
      alert('Error fetching rank tiers. Check console for details.');
    } finally {
      setTiersLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.rangeName || !formData.startTier || !formData.endTier || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const payload: any = {
        range_name: formData.rangeName,
        price_per_star: parseFloat(formData.price), // Always send this - backend accepts it for all games
        major_rank_crossing_fee: formData.majorRankFee
          ? parseFloat(formData.majorRankFee)
          : undefined,
      };

      let response;
      if (editingPricing) {
        // Update existing pricing
        response = await pricingApi.updatePricing(editingPricing.id, payload, token);
      } else {
        // Create new pricing
        payload.game = game;
        payload.tier_start_id = formData.startTier.id;
        payload.tier_end_id = formData.endTier.id;
        response = await pricingApi.createPricing(payload, token);
      }

      if (response.success) {
        // Reset form
        setFormData({
          rangeName: '',
          startTier: null,
          endTier: null,
          price: '',
          majorRankFee: '',
        });
        onSuccess();
        onClose();
      } else {
        alert(response.message || 'Failed to save pricing range');
      }
    } catch (error) {
      console.error('Error saving pricing range:', error);
      alert('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    formGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    dropdownButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    dropdownButtonText: {
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    dropdownMenu: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 8,
      height: 250,
      marginTop: theme.spacing.sm,
      zIndex: 1000,
    },
    dropdownItem: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dropdownItemText: {
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
      fontSize: 13,
    },
    previewBox: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    previewLabel: {
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    previewValue: {
      fontFamily: 'DMMono',
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 1,
    },
  });

  // Filter end tiers to only show tiers >= start tier
  const availableEndTiers = formData.startTier
    ? ranks.filter((r) => r.tier_order >= formData.startTier!.tier_order)
    : ranks;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{editingPricing ? 'Edit Price Range' : 'Add Price Range'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Range Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Range Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Master to Grandmaster"
              placeholderTextColor={`${theme.colors.textSecondary}80`}
              value={formData.rangeName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, rangeName: text }))
              }
            />
          </View>

          {/* Start Tier Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Tier *</Text>
            <Pressable
              style={styles.dropdownButton}
              onPress={handleStartDropdownPress}
              disabled={tiersLoading}
            >
              <Text style={styles.dropdownButtonText}>
                {tiersLoading ? 'Loading tiers...' : (formData.startTier ? formData.startTier.tier_name : 'Select start tier')}
              </Text>
            </Pressable>
            {showStartDropdown && (
              <ScrollView 
                style={styles.dropdownMenu} 
                scrollEnabled={true}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {ranks.map((tier) => (
                  <Pressable
                    key={tier.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, startTier: tier }));
                      setShowStartDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{tier.tier_name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* End Tier Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Tier *</Text>
            <Pressable
              style={styles.dropdownButton}
              onPress={() => setShowEndDropdown(!showEndDropdown)}
              disabled={!formData.startTier}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  !formData.startTier && { color: theme.colors.textSecondary },
                ]}
              >
                {formData.endTier ? formData.endTier.tier_name : 'Select end tier'}
              </Text>
            </Pressable>
            {showEndDropdown && (
              <ScrollView 
                style={styles.dropdownMenu} 
                scrollEnabled={true}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {availableEndTiers.map((tier) => (
                  <Pressable
                    key={tier.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, endTier: tier }));
                      setShowEndDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{tier.tier_name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Price Input - Label changes based on game */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {game === 'MLBB' ? 'Price Per Star (₱) *' : 'Price Per Tier (₱) *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={game === 'MLBB' ? 'e.g., 50.00' : 'e.g., 50.00'}
              placeholderTextColor={`${theme.colors.textSecondary}80`}
              keyboardType="decimal-pad"
              value={formData.price}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, price: text }))
              }
            />
          </View>

          {/* Major Rank Crossing Fee (Optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Major Rank Crossing Fee (₱) (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500.00"
              placeholderTextColor={`${theme.colors.textSecondary}80`}
              keyboardType="decimal-pad"
              value={formData.majorRankFee}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, majorRankFee: text }))
              }
            />
          </View>

          {/* Preview */}
          {formData.startTier && formData.endTier && formData.price && (
            <View style={styles.previewBox}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  {game === 'MLBB' ? 'Total Stars:' : 'Total Tiers:'}
                </Text>
                <Text style={styles.previewValue}>{totalStars}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Base Cost:</Text>
                <Text style={styles.previewValue}>₱{(totalStars * parseFloat(formData.price)).toFixed(2)}</Text>
              </View>
              {formData.majorRankFee && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Crossing Fee:</Text>
                  <Text style={styles.previewValue}>₱{parseFloat(formData.majorRankFee).toFixed(2)}</Text>
                </View>
              )}
              <View
                style={[
                  styles.previewRow,
                  { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm },
                ]}
              >
                <Text style={[styles.previewLabel, { fontWeight: 'bold' }]}>Total Cost:</Text>
                <Text style={[styles.previewValue, { fontSize: 15 }]}>₱{totalCost.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.cancelButton}>
            <Button
              label="Cancel"
              onPress={onClose}
              variant="secondary"
              disabled={loading}
            />
          </View>
          <View style={styles.saveButton}>
            <Button
              label={loading ? (editingPricing ? 'Updating...' : 'Saving...') : (editingPricing ? 'Update Range' : 'Save Range')}
              onPress={handleSave}
              variant="primary"
              disabled={loading}
            />
          </View>
        </View>

        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
