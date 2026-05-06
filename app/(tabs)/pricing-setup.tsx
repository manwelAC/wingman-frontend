import { AddPricingRangeModal } from '@/components/ui/AddPricingRangeModal';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { pricingApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';

const GAMES = ['CODM', 'MLBB', 'Valorant'];

interface PricingRange {
  id: number;
  game: string;
  range_name: string;
  tier_start_id: number;
  tier_end_id: number;
  price_per_star: string;
  major_rank_crossing_fee: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  tierStart: {
    id: number;
    tier_name: string;
    tier_order: number;
  };
  tierEnd: {
    id: number;
    tier_name: string;
    tier_order: number;
  };
}

export default function PricingSetupScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const [activeGame, setActiveGame] = useState('CODM');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pricingRanges, setPricingRanges] = useState<PricingRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<PricingRange | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Load pricing when game changes
  useEffect(() => {
    fetchPricing();
  }, [activeGame]);

  const fetchPricing = async () => {
    try {
      const cacheKey = `cachedPricing_${activeGame}`;
      const cachedPricing = await AsyncStorage.getItem(cacheKey);
      if (cachedPricing) {
        setPricingRanges(JSON.parse(cachedPricing));
      } else {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await pricingApi.fetchPricing(activeGame, token);
      if (response.success && response.data) {
        const gameData = response.data[activeGame] || [];
        setPricingRanges(gameData);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(gameData));
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePricing = async (pricingId: number) => {
    setDeletingId(pricingId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setDeleting(false);
        return;
      }

      console.log('🗑️  Deleting pricing ID:', deletingId);
      console.log('🌐 Sending DELETE request to backend...');
      
      const response = await pricingApi.deletePricing(deletingId, token);
      console.log('Delete response:', response);
      
      if (response.success) {
        console.log('✅ Delete successful, refetching pricing...');
        // Refetch to confirm deletion from server
        await fetchPricing();
        setShowDeleteModal(false);
        setDeletingId(null);
      } else {
        console.error('❌ Delete failed:', response.message);
        alert(response.message || 'Failed to delete pricing range');
      }
    } catch (error) {
      console.error('❌ Error deleting pricing:', error);
      alert('Error deleting pricing range');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditPricing = (pricing: PricingRange) => {
    setSelectedPricing(pricing);
    setShowEditModal(true);
  };

  const togglePricingStatus = async (pricingId: number, currentStatus: boolean) => {
    try {
      setTogglingId(pricingId);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        return;
      }

      console.log(`🔄 Toggling pricing ID ${pricingId} to ${!currentStatus}`);
      
      // Update local state optimistically
      setPricingRanges((prev) =>
        prev.map((range) =>
          range.id === pricingId ? { ...range, is_active: !currentStatus } : range
        )
      );

      // Call update API
      const response = await pricingApi.updatePricing(pricingId, {
        is_active: !currentStatus,
      }, token);

      console.log('Toggle response:', response);

      if (!response.success) {
        // Revert on failure
        console.error('❌ Toggle failed:', response.message);
        setPricingRanges((prev) =>
          prev.map((range) =>
            range.id === pricingId ? { ...range, is_active: currentStatus } : range
          )
        );
        alert(response.message || 'Failed to update pricing status');
      } else {
        // Refetch to confirm backend persisted the change
        console.log('✅ Toggle successful, refetching to confirm...');
        await fetchPricing();
      }
    } catch (error) {
      console.error('Error toggling pricing status:', error);
      alert('Error updating pricing status');
      // Revert on error
      setPricingRanges((prev) =>
        prev.map((range) =>
          range.id === pricingId ? { ...range, is_active: currentStatus } : range
        )
      );
    } finally {
      setTogglingId(null);
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
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xl,
      marginBottom: theme.spacing.xs,
    },
    gameTabsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
      paddingVertical: theme.spacing.xs,
      justifyContent: 'center',
    },
    gameTab: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: 0,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeGameTab: {
      borderBottomColor: primaryColor,
    },
    gameTabText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
    },
    activeGameTabText: {
      color: primaryColor,
    },
    rangeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    rangeHeader: {
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rangeName: {
      fontSize: 15,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    deleteButton: {
      padding: theme.spacing.sm,
    },
    editButton: {
      padding: theme.spacing.sm,
    },
    rangeInfo: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    buttonContainer: {
      marginBottom: theme.spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyStateText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Pricing</Text>
        </View>

        {/* Game Tabs */}
        <View style={styles.gameTabsContainer}>
          {GAMES.map((game) => (
            <Pressable
              key={game}
              style={[styles.gameTab, activeGame === game && styles.activeGameTab]}
              onPress={() => setActiveGame(game)}
            >
              <Text
                style={[
                  styles.gameTabText,
                  activeGame === game && styles.activeGameTabText,
                ]}
              >
                {game}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Add New Range Button */}
        <View style={styles.buttonContainer}>
          <Button
            label="Add Price Range"
            onPress={() => setShowAddModal(true)}
            variant="primary"
            fullWidth
          />
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}

        {/* Pricing Ranges List */}
        {!loading && pricingRanges.length > 0 && (
          <View>
            {pricingRanges.map((range) => (
              <View key={range.id} style={styles.rangeCard}>
                <View style={styles.rangeHeader}>
                  <Text style={styles.rangeName}>{range.range_name}</Text>
                  <View style={styles.actionButtons}>
                    <Switch
                      value={range.is_active}
                      onValueChange={() => togglePricingStatus(range.id, range.is_active)}
                      disabled={togglingId === range.id}
                      trackColor={{ false: '#767577', true: primaryColor }}
                      thumbColor={range.is_active ? primaryColor : '#f4f3f4'}
                    />
                    <Pressable 
                      style={styles.editButton}
                      onPress={() => handleEditPricing(range)}
                    >
                      <Ionicons name="create-outline" size={20} color={theme.colors.textPrimary} />
                    </Pressable>
                    <Pressable 
                      style={styles.deleteButton}
                      onPress={() => handleDeletePricing(range.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.colors.statusDanger} />
                    </Pressable>
                  </View>
                </View>
                <Text style={[styles.rangeInfo, !range.is_active && { opacity: 0.5 }]}>
                  ₱{parseFloat(range.price_per_star).toFixed(2)} per {activeGame === 'MLBB' ? 'star' : 'tier'}
                </Text>
                <Text style={[styles.rangeInfo, !range.is_active && { opacity: 0.5 }]}>
                  {range.tierStart?.tier_name || `Tier ${range.tier_start_id}`} → {range.tierEnd?.tier_name || `Tier ${range.tier_end_id}`}
                </Text>
                {parseFloat(range.major_rank_crossing_fee) > 0 && (
                  <Text style={[styles.rangeInfo, !range.is_active && { opacity: 0.5 }]}>
                    Crossing Fee: ₱{parseFloat(range.major_rank_crossing_fee).toFixed(2)}
                  </Text>
                )}
                {!range.is_active && (
                  <Text style={[styles.rangeInfo, { color: theme.colors.statusDanger, marginTop: 8 }]}>
                    Inactive
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && pricingRanges.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No pricing ranges yet. Tap "Add Price Range" to create one.
            </Text>
          </View>
        )}
      </ScrollView>

      <AddPricingRangeModal
        visible={showAddModal}
        game={activeGame}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchPricing();
        }}
      />

      <AddPricingRangeModal
        visible={showEditModal}
        game={activeGame}
        editingPricing={selectedPricing}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPricing(null);
        }}
        onSuccess={() => {
          fetchPricing();
          setShowEditModal(false);
          setSelectedPricing(null);
        }}
      />

      <DeleteConfirmationModal
        visible={showDeleteModal}
        title="Delete Pricing Range?"
        message="This action cannot be undone. The pricing range will be permanently deleted."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
      />

      <FloatingNav />
    </SafeAreaView>
  );
}
