import { Button } from '@/components/ui/Button';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { grindApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const ViewShot = require('react-native-view-shot').default;

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

const STATUS_OPTIONS = ['all', 'not_started', 'in_progress', 'completed', 'cancelled'];

export default function GrindsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const primaryColor = colorScheme === 'dark' ? '#00D9FF' : theme.colors.primary;
  const [grinds, setGrinds] = useState<Grind[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGrind, setSelectedGrind] = useState<Grind | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const receiptViewRef = useRef<any>(null);

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

  const handleStartGrind = async () => {
    if (!selectedGrind) return;
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await grindApi.updateGrindProgress(selectedGrind.id, { status: 'in_progress' }, token);
      
      if (response.success) {
        console.log('Grind started:', selectedGrind.id);
        // Update selected grind with new data
        if (response.data && selectedGrind) {
          setSelectedGrind({
            ...selectedGrind,
            status: response.data.status || 'in_progress',
            started_at: response.data.started_at,
          } as Grind);
        }
        // Refresh list after action
        await loadGrinds();
        setShowDetailModal(false);
      } else {
        console.error('Failed to start grind:', response.message);
      }
    } catch (error) {
      console.error('Failed to start grind:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteGrind = async () => {
    if (!selectedGrind) return;
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await grindApi.completeGrind(selectedGrind.id, token);
      
      if (response.success) {
        console.log('Grind completed:', selectedGrind.id);
        // Update selected grind with new data
        if (response.data && selectedGrind) {
          setSelectedGrind({
            ...selectedGrind,
            status: response.data.status || 'completed',
            progress_percentage: response.data.progress_percentage || 100,
            completed_at: response.data.completed_at,
          } as Grind);
        }
        // Refresh list after action
        await loadGrinds();
        setShowDetailModal(false);
      } else {
        console.error('Failed to complete grind:', response.message);
      }
    } catch (error) {
      console.error('Failed to complete grind:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelGrind = async () => {
    if (!selectedGrind) return;
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await grindApi.updateGrindProgress(selectedGrind.id, { status: 'cancelled' }, token);
      
      if (response.success) {
        console.log('Grind cancelled:', selectedGrind.id);
        // Update selected grind with new data
        if (response.data && selectedGrind) {
          setSelectedGrind({
            ...selectedGrind,
            status: response.data.status || 'cancelled',
            cancelled_at: response.data.cancelled_at,
          } as Grind);
        }
        // Refresh list after action
        await loadGrinds();
        setShowDetailModal(false);
      } else {
        console.error('Failed to cancel grind:', response.message);
      }
    } catch (error) {
      console.error('Failed to cancel grind:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGrind = async () => {
    if (!selectedGrind) return;
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await grindApi.deleteGrind(selectedGrind.id, token);
      
      if (response.success) {
        console.log('Grind deleted:', selectedGrind.id);
        // Refresh list after action
        await loadGrinds();
        setShowActionModal(false);
        setShowConfirmDelete(false);
      } else {
        console.error('Failed to delete grind:', response.message);
      }
    } catch (error) {
      console.error('Failed to delete grind:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptViewRef.current) return;
    try {
      setActionLoading(true);
      // Capture the receipt view as an image
      const uri = await receiptViewRef.current.capture();
      
      // Share the captured image directly (allows saving, downloading, etc.)
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Download Receipt - ${selectedGrind?.grind_number}`,
        UTI: 'com.compuserve.gif',
      });
    } catch (error) {
      console.error('Failed to download receipt:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredGrinds = useMemo(() => {
    return grinds.filter((grind) => {
      // Status filter
      if (selectedStatus !== 'all' && grind.status !== selectedStatus) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          grind.grind_number.toLowerCase().includes(query) ||
          grind.customer.display_name.toLowerCase().includes(query) ||
          grind.game.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [grinds, searchQuery, selectedStatus]);

  const getStatusColor = (status: string | undefined) => {
    if (!status) return theme.colors.textSecondary;
    switch (status.toLowerCase()) {
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

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return null;
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMs = end.getTime() - start.getTime();
      
      if (durationMs < 0) return null;
      
      const totalSeconds = Math.floor(durationMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch {
      return null;
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
    },
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    searchContainer: {
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontFamily: 'DMMono',
      fontSize: 14,
      color: theme.colors.textPrimary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterContainer: {
      marginBottom: theme.spacing.md,
    },
    filterLabel: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    filterTabs: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginHorizontal: -theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      overflow: 'visible',
    },
    filterTab: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    activeFilterTab: {
      backgroundColor: primaryColor,
      borderColor: primaryColor,
    },
    filterTabText: {
      fontSize: 11,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
    },
    activeFilterTabText: {
      color: '#FFFFFF',
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: 180 + insets.bottom,
    },
    grindCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    grindHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    grindNumber: {
      fontSize: 14,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: primaryColor,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    statusText: {
      fontSize: 11,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
    },
    customerName: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    grindDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 11,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    progressContainer: {
      marginTop: theme.spacing.sm,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      backgroundColor: primaryColor,
    },
    progressText: {
      fontSize: 11,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    emptyState: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    emptyIcon: {
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
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
    resultCount: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    detailModalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: theme.spacing.lg,
      maxHeight: '90%',
    },
    detailModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    detailModalTitle: {
      fontSize: 18,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    detailSection: {
      marginBottom: theme.spacing.xl,
    },
    detailSectionTitle: {
      fontSize: 15,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    detailRowLabel: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    detailRowValue: {
      fontSize: 15,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    actionButtonsContainer: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    actionModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    actionModalContent: {
      backgroundColor: colorScheme === 'dark' 
        ? 'rgba(31, 41, 55, 0.8)'
        : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colorScheme === 'dark'
        ? 'rgba(148, 163, 184, 0.3)'
        : 'rgba(226, 232, 240, 0.6)',
      padding: theme.spacing.lg,
      width: '100%',
      maxWidth: 300,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
      backdropFilter: 'blur(10px)',
    },
    actionModalHeader: {
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.border,
    },
    actionModalTitle: {
      fontSize: 16,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    actionModalSubtitle: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    actionModalButtons: {
      gap: theme.spacing.md,
    },
    actionModalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    actionModalButtonIcon: {
      marginRight: theme.spacing.md,
    },
    actionModalButtonLabel: {
      fontSize: 14,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
  });

  if (loading && grinds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Grinds</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
        <FloatingNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grinds</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchInput,
              { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.sm },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: theme.spacing.sm,
                fontFamily: 'DMMono',
                fontSize: 14,
                color: theme.colors.textPrimary,
              }}
              placeholder="Search grinds, customers, games..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
            contentContainerStyle={{ gap: theme.spacing.xs, paddingRight: theme.spacing.xl }}
          >
            {STATUS_OPTIONS.map((status) => (
              <Pressable
                key={status}
                style={[
                  styles.filterTab,
                  selectedStatus === status && styles.activeFilterTab,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedStatus === status && styles.activeFilterTabText,
                  ]}
                >
                  {getStatusLabel(status)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredGrinds.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={searchQuery || selectedStatus !== 'all' ? 'search' : 'game-controller-outline'}
                size={48}
                color={theme.colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedStatus !== 'all' ? 'No matches found' : 'No Grinds Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by logging a grind to see it here'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {filteredGrinds.length} grind{filteredGrinds.length !== 1 ? 's' : ''}
            </Text>
            {filteredGrinds.map((grind) => (
              <Pressable
                key={grind.id}
                onPress={() => {
                  setSelectedGrind(grind);
                  setShowActionModal(true);
                }}
              >
                <View style={styles.grindCard}>
                <View style={styles.grindHeader}>
                  <Text style={styles.grindNumber}>{grind.grind_number}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(grind.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(grind.status) }]}>
                      {getStatusLabel(grind.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.customerName}>{grind.customer.display_name}</Text>

                <View style={styles.grindDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Game</Text>
                    <Text style={styles.detailValue}>{grind.game}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{grind.service_type.replace('_', '-')}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.detailValue}>₱{parseFloat(grind.base_price).toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(grind.progress_percentage, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{grind.progress_percentage}% complete</Text>
                </View>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Action Modal - Floating Menu */}
      <Modal
        visible={showActionModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable 
          style={styles.actionModalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable 
            style={styles.actionModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle}>{selectedGrind?.grind_number}</Text>
              <Text style={styles.actionModalSubtitle}>{selectedGrind?.customer.display_name}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionModalButtons}>
              {/* View Button */}
              <Pressable 
                style={styles.actionModalButton}
                onPress={() => {
                  setShowActionModal(false);
                  setShowDetailModal(true);
                }}
              >
                <View style={styles.actionModalButtonIcon}>
                  <Ionicons name="eye" size={20} color={primaryColor} />
                </View>
                <Text style={styles.actionModalButtonLabel}>View</Text>
              </Pressable>

              {/* Receipt Button */}
              <Pressable 
                style={styles.actionModalButton}
                onPress={() => {
                  setShowActionModal(false);
                  setShowReceiptModal(true);
                }}
              >
                <View style={styles.actionModalButtonIcon}>
                  <Ionicons name="receipt" size={20} color={primaryColor} />
                </View>
                <Text style={styles.actionModalButtonLabel}>Receipt</Text>
              </Pressable>

              {/* Edit Button */}
              <Pressable style={styles.actionModalButton}>
                <View style={styles.actionModalButtonIcon}>
                  <Ionicons name="create-outline" size={20} color={primaryColor} />
                </View>
                <Text style={styles.actionModalButtonLabel}>Edit</Text>
              </Pressable>

              {/* Delete Button */}
              <Pressable 
                style={[styles.actionModalButton, { borderColor: theme.colors.statusDanger }]}
                onPress={() => {
                  setShowConfirmDelete(true);
                }}
                disabled={actionLoading}
              >
                <View style={styles.actionModalButtonIcon}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.statusDanger} />
                </View>
                <Text style={[styles.actionModalButtonLabel, { color: theme.colors.statusDanger }]}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <ScrollView
            style={styles.detailModalContent}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          >
            {selectedGrind && (
              <>
                <View style={styles.detailModalHeader}>
                  <View>
                    <Text style={styles.detailModalTitle}>{selectedGrind.grind_number}</Text>
                    <Text style={{ fontSize: 13, fontFamily: 'DMMono', color: theme.colors.textSecondary, marginTop: 4 }}>
                      {selectedGrind.customer.display_name}
                    </Text>
                  </View>
                  <Pressable onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </Pressable>
                </View>

                {/* Status */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Status</Text>
                  <View
                    style={[
                      styles.detailRow,
                      { marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 },
                    ]}
                  >
                    <View
                      style={[
                        {
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: getStatusColor(selectedGrind.status) + '20',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'DMMono',
                          fontWeight: 'bold',
                          color: getStatusColor(selectedGrind.status),
                        }}
                      >
                        {getStatusLabel(selectedGrind.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Timeline */}
                {(selectedGrind.started_at || selectedGrind.completed_at || selectedGrind.cancelled_at) && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Timeline</Text>
                    {selectedGrind.started_at && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>Started</Text>
                        <Text style={styles.detailRowValue}>{formatDateTime(selectedGrind.started_at)}</Text>
                      </View>
                    )}
                    {selectedGrind.completed_at && (
                      <View style={[styles.detailRow, selectedGrind.cancelled_at ? {} : { borderBottomWidth: 0 }]}>
                        <Text style={styles.detailRowLabel}>Completed</Text>
                        <Text style={styles.detailRowValue}>{formatDateTime(selectedGrind.completed_at)}</Text>
                      </View>
                    )}
                    {selectedGrind.cancelled_at && (
                      <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.detailRowLabel}>Cancelled</Text>
                        <Text style={styles.detailRowValue}>{formatDateTime(selectedGrind.cancelled_at)}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Game & Service Type */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Service Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Game</Text>
                    <Text style={styles.detailRowValue}>{selectedGrind.game}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailRowLabel}>Type</Text>
                    <Text style={styles.detailRowValue}>{selectedGrind.service_type.replace('_', '-')}</Text>
                  </View>
                </View>

                {/* Pricing */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Pricing</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailRowLabel}>Base Price</Text>
                    <Text style={styles.detailRowValue}>₱{parseFloat(selectedGrind.base_price).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailRowLabel}>Final Price</Text>
                    <Text style={styles.detailRowValue}>₱{parseFloat(selectedGrind.final_price).toFixed(2)}</Text>
                  </View>
                </View>

                {/* Progress - Replaced with Status Summary */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Current Status</Text>
                  <View
                    style={{
                      backgroundColor: getStatusColor(selectedGrind.status) + '20',
                      borderLeftWidth: 4,
                      borderLeftColor: getStatusColor(selectedGrind.status),
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: 'DMMono', fontWeight: 'bold', color: getStatusColor(selectedGrind.status) }}>
                      {getStatusLabel(selectedGrind.status)}
                    </Text>
                    {selectedGrind.status === 'in_progress' && selectedGrind.started_at && (
                      <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: theme.colors.textSecondary, marginTop: 4 }}>
                        Started {formatDateTime(selectedGrind.started_at)}
                      </Text>
                    )}
                    {selectedGrind.status === 'completed' && selectedGrind.completed_at && (
                      <>
                        <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: theme.colors.textSecondary, marginTop: 4 }}>
                          Completed {formatDateTime(selectedGrind.completed_at)}
                        </Text>
                        {calculateDuration(selectedGrind.started_at, selectedGrind.completed_at) && (
                          <Text style={{ fontSize: 11, fontFamily: 'DMMono', fontWeight: 'bold', color: getStatusColor(selectedGrind.status), marginTop: 6 }}>
                            ⏱️ {calculateDuration(selectedGrind.started_at, selectedGrind.completed_at)}
                          </Text>
                        )}
                      </>
                    )}
                    {selectedGrind.status === 'cancelled' && selectedGrind.cancelled_at && (
                      <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: theme.colors.textSecondary, marginTop: 4 }}>
                        Cancelled {formatDateTime(selectedGrind.cancelled_at)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions based on status */}
                <View style={styles.actionButtonsContainer}>
                  {selectedGrind.status === 'not_started' && (
                    <Button
                      label={actionLoading ? 'Starting...' : 'Start Grind'}
                      onPress={handleStartGrind}
                      variant="primary"
                      fullWidth
                      disabled={actionLoading}
                    />
                  )}

                  {selectedGrind.status === 'in_progress' && (
                    <>
                      <Button
                        label={actionLoading ? 'Completing...' : 'Complete Grind'}
                        onPress={handleCompleteGrind}
                        variant="primary"
                        fullWidth
                        disabled={actionLoading}
                      />
                      <Button
                        label={actionLoading ? 'Cancelling...' : 'Cancel Grind'}
                        onPress={handleCancelGrind}
                        variant="destructive"
                        fullWidth
                        disabled={actionLoading}
                      />
                    </>
                  )}

                  {(selectedGrind.status === 'completed' || selectedGrind.status === 'cancelled') && (
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'DMMono',
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        paddingVertical: theme.spacing.lg,
                      }}
                    >
                      This grind is in a terminal state and cannot be modified.
                    </Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.lg }}>
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, padding: theme.spacing.lg, maxHeight: '90%', width: '100%' }}>
            {/* Receipt Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Text style={{ fontSize: 18, fontFamily: 'DMMono-Medium', fontWeight: 'bold', color: theme.colors.textPrimary }}>
                Receipt
              </Text>
              <Pressable onPress={() => setShowReceiptModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            {/* Receipt Content */}
            <ScrollView style={{ maxHeight: '70%' }}>
              <ViewShot ref={receiptViewRef} options={{ format: 'png', quality: 0.95 }}>
                <View style={{ backgroundColor: '#FFFFFF', padding: theme.spacing.lg, borderRadius: 12 }}>
                  {/* Header */}
                  <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg, paddingBottom: theme.spacing.lg, borderBottomWidth: 2, borderBottomColor: '#E5E7EB' }}>
                    <Text style={{ fontSize: 24, fontFamily: 'DMMono-Medium', fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                      WINGMAN
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'DMMono', color: '#6B7280' }}>
                      Grind Receipt
                    </Text>
                  </View>

                  {/* Grind Number */}
                  <View style={{ marginBottom: theme.spacing.lg }}>
                    <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280', marginBottom: 4 }}>
                      GRIND NUMBER
                    </Text>
                    <Text style={{ fontSize: 16, fontFamily: 'DMMono-Medium', fontWeight: 'bold', color: '#1F2937' }}>
                      {selectedGrind?.grind_number}
                    </Text>
                  </View>

                  {/* Customer Info */}
                  <View style={{ marginBottom: theme.spacing.lg }}>
                    <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280', marginBottom: 4 }}>
                      CUSTOMER
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: 'DMMono', color: '#1F2937' }}>
                      {selectedGrind?.customer.display_name}
                    </Text>
                  </View>

                  {/* Service Details */}
                  <View style={{ marginBottom: theme.spacing.lg, paddingBottom: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280' }}>Game</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'DMMono', color: '#1F2937', fontWeight: '500' }}>
                        {selectedGrind?.game}
                      </Text>
                    </View>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280' }}>Service Type</Text>
                      <Text style={{ fontSize: 13, fontFamily: 'DMMono', color: '#1F2937', fontWeight: '500' }}>
                        {selectedGrind?.service_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    {selectedGrind?.due_date && (
                      <View>
                        <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280' }}>Due Date</Text>
                        <Text style={{ fontSize: 13, fontFamily: 'DMMono', color: '#1F2937', fontWeight: '500' }}>
                          {new Date(selectedGrind.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Pricing */}
                  <View style={{ marginBottom: theme.spacing.lg, paddingBottom: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'DMMono', color: '#6B7280' }}>Base Price</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'DMMono', color: '#1F2937' }}>
                        ₱{parseFloat(selectedGrind?.base_price || '0').toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, fontFamily: 'DMMono', color: '#6B7280' }}>Final Price</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'DMMono', fontWeight: '600', color: '#059669' }}>
                        ₱{parseFloat(selectedGrind?.final_price || '0').toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Status & Dates */}
                  <View style={{ marginBottom: theme.spacing.lg }}>
                    <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280', marginBottom: 8 }}>STATUS</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'DMMono-Medium', fontWeight: 'bold', color: getStatusColor(selectedGrind?.status), marginBottom: 8 }}>
                      {getStatusLabel(selectedGrind?.status || '')}
                    </Text>
                    {selectedGrind?.completed_at && (
                      <Text style={{ fontSize: 11, fontFamily: 'DMMono', color: '#6B7280' }}>
                        Completed: {formatDateTime(selectedGrind.completed_at)}
                      </Text>
                    )}
                  </View>

                  {/* Footer */}
                  <View style={{ alignItems: 'center', borderTopWidth: 2, borderTopColor: '#E5E7EB', paddingTopWidth: theme.spacing.lg, marginTop: theme.spacing.lg }}>
                    <Text style={{ fontSize: 10, fontFamily: 'DMMono', color: '#6B7280', marginTop: 8 }}>
                      Generated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </ViewShot>
            </ScrollView>

            {/* Download Button */}
            <View style={{ marginTop: theme.spacing.lg }}>
              <Button
                label={actionLoading ? 'Downloading...' : '⬇️ Download as PNG'}
                onPress={handleDownloadReceipt}
                variant="primary"
                fullWidth
                disabled={actionLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      <DeleteConfirmationModal
        visible={showConfirmDelete}
        title="Delete Grind?"
        message={`Are you sure you want to delete grind ${selectedGrind?.grind_number}? This action cannot be undone.`}
        loading={actionLoading}
        onConfirm={handleDeleteGrind}
        onCancel={() => setShowConfirmDelete(false)}
        confirmText="Delete"
        iconName="trash"
        isDangerous={true}
      />

      <FloatingNav />
    </SafeAreaView>
  );
}
