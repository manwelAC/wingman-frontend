import { Button } from '@/components/ui/Button';
import PaymentMethodCard from '@/components/ui/PaymentMethodCard';
import PaymentMethodModal from '@/components/ui/PaymentMethodModal';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { useTheme } from '@/constants/useTheme';
import { paymentMethodApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function PaymentMethodsScreen() {
  const theme = useTheme();
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [userPaymentMethods, setUserPaymentMethods] = useState<any>({
    e_wallet: [],
    bank_transfer: [],
    credit_card: [],
  });
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [paymentModalMode, setPaymentModalMode] = useState<'add' | 'edit'>('add');
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [savingPaymentMethod, setSavingPaymentMethod] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load payment methods on mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      // Load from cache first
      const cachedAvailableMethods = await AsyncStorage.getItem('cachedAvailableMethods');
      const cachedUserMethods = await AsyncStorage.getItem('cachedPaymentMethods');
      
      if (cachedAvailableMethods) {
        setAvailableMethods(JSON.parse(cachedAvailableMethods));
      }
      
      if (cachedUserMethods) {
        setUserPaymentMethods(JSON.parse(cachedUserMethods));
      } else {
        setLoadingPaymentMethods(true);
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const [availableRes, userRes] = await Promise.all([
        paymentMethodApi.getAvailableMethods(token),
        paymentMethodApi.getUserMethods(token),
      ]);

      if (availableRes.success && availableRes.data && availableRes.data.data) {
        const allMethods = [
          ...(availableRes.data.data.e_wallet || []),
          ...(availableRes.data.data.bank_transfer || []),
          ...(availableRes.data.data.credit_card || []),
        ];
        setAvailableMethods(allMethods);
        await AsyncStorage.setItem('cachedAvailableMethods', JSON.stringify(allMethods));
      }

      if (userRes.success && userRes.data && userRes.data.data) {
        const userMethods = {
          e_wallet: userRes.data.data.e_wallet || [],
          bank_transfer: userRes.data.data.bank_transfer || [],
          credit_card: userRes.data.data.credit_card || [],
        };
        setUserPaymentMethods(userMethods);
        await AsyncStorage.setItem('cachedPaymentMethods', JSON.stringify(userMethods));
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setPaymentModalMode('add');
    setEditingPaymentMethod(null);
    setPaymentMethodModalVisible(true);
  };

  const handleEditPaymentMethod = (method: any) => {
    setPaymentModalMode('edit');
    setEditingPaymentMethod(method);
    setPaymentMethodModalVisible(true);
  };

  const handleSavePaymentMethod = async (
    methodTypeId: number,
    accountHolder: string,
    accountIdentifier: string
  ) => {
    try {
      setSavingPaymentMethod(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      let response: any = null;
      if (paymentModalMode === 'add') {
        response = await paymentMethodApi.addPaymentMethod(
          {
            payment_method_type_id: methodTypeId,
            account_identifier: accountIdentifier,
            account_holder_name: accountHolder,
          },
          token
        );
      } else if (editingPaymentMethod) {
        response = await paymentMethodApi.updatePaymentMethod(
          editingPaymentMethod.id,
          {
            account_identifier: accountIdentifier,
            account_holder_name: accountHolder,
          },
          token
        );
      }

      if (response && response.success) {
        setErrorMessage('');
        setSuccessTitle('Success');
        setSuccessMessage(
          paymentModalMode === 'add'
            ? 'Payment method added successfully'
            : 'Payment method updated successfully'
        );
        setSuccessModalVisible(true);
        setPaymentMethodModalVisible(false);
        await loadPaymentMethods();
      } else {
        setErrorMessage(response.message || 'Failed to save payment method');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      setErrorMessage('Failed to save payment method. Please try again.');
    } finally {
      setSavingPaymentMethod(false);
    }
  };

  const handleTogglePaymentMethod = async (id: number, isActive: boolean) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await paymentMethodApi.togglePaymentMethod(id, isActive, token);
      if (response.success) {
        await loadPaymentMethods();
      } else {
        setErrorMessage(response.message || 'Failed to toggle payment method');
      }
    } catch (error) {
      console.error('Error toggling payment method:', error);
      setErrorMessage('Failed to toggle payment method');
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (!token) return;

              const response = await paymentMethodApi.deletePaymentMethod(id, token);
              if (response.success) {
                setSuccessTitle('Success');
                setSuccessMessage('Payment method deleted');
                setSuccessModalVisible(true);
                await loadPaymentMethods();
              } else {
                setErrorMessage(response.message || 'Failed to delete payment method');
              }
            } catch (error) {
              console.error('Error deleting payment method:', error);
              setErrorMessage('Failed to delete payment method');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 18,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xl,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: 120,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    centeredText: {
      textAlign: 'center',
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    categorySection: {
      marginBottom: theme.spacing.lg,
    },
    categoryTitle: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Payment Methods</Text>
        <Pressable
          onPress={handleAddPaymentMethod}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            backgroundColor: theme.colors.primary + '20',
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'DMMono',
              fontWeight: 'bold',
              color: theme.colors.primary,
            }}
          >
            + Add
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage && (
          <View
            style={{
              backgroundColor: theme.colors.statusDanger + '20',
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.statusDanger,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'DMMono',
                color: theme.colors.statusDanger,
              }}
            >
              {errorMessage}
            </Text>
            <Pressable
              onPress={() => setErrorMessage('')}
              style={{ marginTop: 8 }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'DMMono',
                  color: theme.colors.statusDanger,
                  fontWeight: 'bold',
                }}
              >
                Dismiss
              </Text>
            </Pressable>
          </View>
        )}

        {loadingPaymentMethods ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : Object.values(userPaymentMethods).every((arr: any) => arr.length === 0) ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.centeredText}>No payment methods added yet</Text>
            <Button
              label="Add Payment Method"
              onPress={handleAddPaymentMethod}
              variant="primary"
              fullWidth
              style={{ marginTop: theme.spacing.lg, maxWidth: 200 }}
            />
          </View>
        ) : (
          <>
            {userPaymentMethods.e_wallet.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>E-WALLETS</Text>
                {userPaymentMethods.e_wallet.map((method: any) => {
                  const methodType = availableMethods.find(
                    m => m.id === method.payment_method_type_id
                  );
                  return (
                    <PaymentMethodCard
                      key={method.id}
                      id={method.id}
                      name={methodType?.name || 'Unknown'}
                      icon={methodType?.icon_name || 'wallet-outline'}
                      logoPath={methodType?.logo_path}
                      accountHolder={method.account_holder_name}
                      accountIdentifier={method.account_identifier}
                      isActive={method.is_active}
                      onEdit={handleEditPaymentMethod}
                      onDelete={handleDeletePaymentMethod}
                      onToggle={handleTogglePaymentMethod}
                    />
                  );
                })}
              </View>
            )}

            {userPaymentMethods.bank_transfer.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>BANK TRANSFERS</Text>
                {userPaymentMethods.bank_transfer.map((method: any) => {
                  const methodType = availableMethods.find(
                    m => m.id === method.payment_method_type_id
                  );
                  return (
                    <PaymentMethodCard
                      key={method.id}
                      id={method.id}
                      name={methodType?.name || 'Unknown'}
                      icon={methodType?.icon_name || 'business-outline'}
                      logoPath={methodType?.logo_path}
                      accountHolder={method.account_holder_name}
                      accountIdentifier={method.account_identifier}
                      isActive={method.is_active}
                      onEdit={handleEditPaymentMethod}
                      onDelete={handleDeletePaymentMethod}
                      onToggle={handleTogglePaymentMethod}
                    />
                  );
                })}
              </View>
            )}

            {userPaymentMethods.credit_card.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>CREDIT CARD</Text>
                {userPaymentMethods.credit_card.map((method: any) => {
                  const methodType = availableMethods.find(
                    m => m.id === method.payment_method_type_id
                  );
                  return (
                    <PaymentMethodCard
                      key={method.id}
                      id={method.id}
                      name={methodType?.name || 'Unknown'}
                      icon={methodType?.icon_name || 'card-outline'}
                      logoPath={methodType?.logo_path}
                      accountHolder={method.account_holder_name}
                      accountIdentifier={method.account_identifier}
                      isActive={method.is_active}
                      onEdit={handleEditPaymentMethod}
                      onDelete={handleDeletePaymentMethod}
                      onToggle={handleTogglePaymentMethod}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <PaymentMethodModal
        visible={paymentMethodModalVisible}
        mode={paymentModalMode}
        selectedMethod={
          editingPaymentMethod
            ? availableMethods.find(m => m.id === editingPaymentMethod.payment_method_type_id)
            : undefined
        }
        currentHolder={editingPaymentMethod?.account_holder_name}
        currentIdentifier={editingPaymentMethod?.account_identifier}
        allMethods={availableMethods}
        loading={savingPaymentMethod}
        error={paymentMethodModalVisible ? errorMessage : undefined}
        onSave={handleSavePaymentMethod}
        onCancel={() => {
          setErrorMessage('');
          setPaymentMethodModalVisible(false);
        }}
      />

      <SuccessModal
        visible={successModalVisible}
        title={successTitle}
        message={successMessage}
        onDismiss={() => setSuccessModalVisible(false)}
      />
    </SafeAreaView>
  );
}
