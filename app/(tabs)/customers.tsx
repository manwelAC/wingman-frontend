import { AddCustomerModal } from '@/components/ui/AddCustomerModal';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import FloatingNav from '@/components/ui/FloatingNav';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { TextInput } from '@/components/ui/TextInput';
import { useTheme } from '@/constants/useTheme';
import { customerApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Customer {
  id: number;
  pilot_id: number;
  display_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function CustomersScreen() {
  const theme = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.display_name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query) ||
        customer.notes?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const cachedCustomers = await AsyncStorage.getItem('cachedCustomers');
      if (cachedCustomers) {
        setCustomers(JSON.parse(cachedCustomers));
      } else {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      const response = await customerApi.fetchCustomers(token);
      if (response.success && response.data) {
        setCustomers(response.data);
        await AsyncStorage.setItem('cachedCustomers', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeletePress = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeletingId(customer.id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;

    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('⚠️  You must be logged in');
        return;
      }

      const response = await customerApi.deleteCustomer(selectedCustomer.id, token);
      if (response.success) {
        setSuccessMessage('Customer deleted successfully');
        setShowSuccessModal(true);
        fetchCustomers();
        setShowDeleteModal(false);
        setSelectedCustomer(null);
        setDeletingId(null);
      } else {
        alert(`❌ Failed to delete customer: ${response.message}`);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('❌ An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCustomer(null);
    fetchCustomers();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingBottom: 100,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing['2xl'],
    },
    titleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.styles.heading.fontSize,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xl,
      
    },
    addButton: {
      padding: theme.spacing.sm,
    },
    searchInput: {
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      fontFamily: 'DMMono',
      fontSize: 13,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surface,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    customerCard: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.sm,
      padding: theme.spacing.lg,
      borderRadius: 12,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    customerDetail: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    customerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      padding: theme.spacing.sm,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.display_name}</Text>
        {item.email && <Text style={styles.customerDetail}>📧 {item.email}</Text>}
        {item.phone && <Text style={styles.customerDetail}>📱 {item.phone}</Text>}
        {item.notes && <Text style={styles.customerDetail}>📝 {item.notes}</Text>}
      </View>
      <View style={styles.customerActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleDeletePress(item)}
        >
          <Ionicons
            name="trash"
            size={20}
            color={theme.colors.statusDanger}
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Customers</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
          </Pressable>
        </View>
        <TextInput
          placeholder="Search by name, email, phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor={`${theme.colors.textSecondary}80`}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? 'No customers match your search' : 'No customers yet'}
          </Text>
          {!searchQuery.trim() && (
            <View style={{ width: '80%', maxWidth: 280 }}>
              <Button 
                onPress={() => setShowAddModal(true)}
                label="Create First Customer"
              />
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modals */}
      <AddCustomerModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedCustomer(null);
        }}
        onSuccess={handleAddSuccess}
      />

      <AddCustomerModal
        visible={showEditModal}
        editingCustomer={selectedCustomer}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        onSuccess={handleAddSuccess}
      />

      <DeleteConfirmationModal
        visible={showDeleteModal}
        title="Delete Customer?"
        message={`Are you sure you want to delete ${selectedCustomer?.display_name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedCustomer(null);
          setDeletingId(null);
        }}
        loading={deleting}
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Success"
        message={successMessage}
        onDismiss={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDuration={2000}
      />

      <FloatingNav />
    </SafeAreaView>
  );
}
