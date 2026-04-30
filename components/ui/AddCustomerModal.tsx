import { useTheme } from '@/constants/useTheme';
import { customerApi } from '@/services/api';
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
import { Button } from './Button';
import { SuccessModal } from './SuccessModal';

interface AddCustomerModalProps {
  visible: boolean;
  editingCustomer?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCustomerModal({
  visible,
  editingCustomer = null,
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (visible && editingCustomer) {
      setFormData({
        displayName: editingCustomer.display_name || '',
        email: editingCustomer.email || '',
        phone: editingCustomer.phone || '',
        notes: editingCustomer.notes || '',
      });
    } else if (visible) {
      // Reset form for new customer
      setFormData({
        displayName: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
  }, [visible, editingCustomer]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.displayName.trim()) {
      alert('⚠️  Customer name is required');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        alert('⚠️  You must be logged in');
        return;
      }

      const payload = {
        display_name: formData.displayName,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
      };

      if (editingCustomer) {
        // Update existing customer
        const response = await customerApi.updateCustomer(editingCustomer.id, payload, token);
        if (response.success) {
          setSuccessMessage('Customer updated successfully');
          setShowSuccessModal(true);
          // Close form and refresh after modal dismisses
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else {
          alert(`❌ Failed to update customer: ${response.message}`);
        }
      } else {
        // Create new customer
        const response = await customerApi.createCustomer(payload, token);
        if (response.success) {
          setSuccessMessage('Customer created successfully');
          setShowSuccessModal(true);
          // Close form and refresh after modal dismisses
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else {
          alert(`❌ Failed to create customer: ${response.message}`);
        }
      }
    } catch (error) {
      console.error('Error submitting customer:', error);
      alert('❌ An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing['2xl'],
      maxHeight: '90%',
      flex: 1,
      flexDirection: 'column',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 20,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    form: {
      gap: theme.spacing.lg,
      flex: 1,
    },
    fieldGroup: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: 13,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.xs,
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontFamily: 'DMMono',
      fontSize: 15,
      color: theme.colors.textPrimary,
      height: 52,
    },
    textareaInput: {
      minHeight: 100,
      textAlignVertical: 'top',
      paddingTop: theme.spacing.sm,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    buttonContainer: {
      flex: 1,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={{ fontSize: 24, color: theme.colors.textPrimary }}>
                ✕
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
              />
            </View>
          ) : (
            <>
              <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Display Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Customer Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., John Doe"
                    placeholderTextColor={`${theme.colors.textSecondary}80`}
                    value={formData.displayName}
                    onChangeText={(text) => handleInputChange('displayName', text)}
                    editable={!loading}
                  />
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor={`${theme.colors.textSecondary}80`}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Phone (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09171234567"
                    placeholderTextColor={`${theme.colors.textSecondary}80`}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>

                {/* Notes */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textareaInput]}
                    placeholder="Add any notes about this customer..."
                    placeholderTextColor={`${theme.colors.textSecondary}80`}
                    value={formData.notes}
                    onChangeText={(text) => handleInputChange('notes', text)}
                    multiline
                    editable={!loading}
                  />
                </View>
              </ScrollView>

              {/* Action Buttons - Outside ScrollView */}
              <View style={styles.buttonGroup}>
                <View style={styles.buttonContainer}>
                  <Button
                    onPress={onClose}
                    variant="secondary"
                    disabled={loading}
                    label="Cancel"
                  />
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    onPress={handleSubmit}
                    variant="primary"
                    disabled={loading}
                    label={editingCustomer ? 'Update' : 'Create'}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={editingCustomer ? 'Customer Updated' : 'Customer Created'}
        message={successMessage}
        onDismiss={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDuration={2000}
      />
    </Modal>
  );
}
