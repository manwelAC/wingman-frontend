import { Button } from '@/components/ui/Button';
import FloatingNav from '@/components/ui/FloatingNav';
import { useTheme } from '@/constants/useTheme';
import { grindApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [grinds, setGrinds] = useState<Grind[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGrind, setSelectedGrind] = useState<Grind | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadGrinds();
    }, [])
  );

  const loadGrinds = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await grindApi.fetchGrinds(token);
      if (response.success && response.data) {
        setGrinds(response.data);
      }
    } catch (error) {
      console.error('Failed to load grinds:', error);
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
        return theme.colors.primary;
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
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
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
      color: theme.colors.primary,
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
      backgroundColor: theme.colors.primary,
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
      marginBottom: theme.spacing.lg,
    },
    detailSectionTitle: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    detailRowLabel: {
      fontSize: 13,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    detailRowValue: {
      fontSize: 13,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    actionButtonsContainer: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
  });

  if (loading && grinds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Grinds</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
                  setShowDetailModal(true);
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

      <FloatingNav />
    </SafeAreaView>
  );
}
