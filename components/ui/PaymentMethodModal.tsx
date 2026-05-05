import { Button } from '@/components/ui/Button';
import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
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

interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  category: string;
  icon_name: string;
  logo_path?: string;
  description: string;
}

interface PaymentMethodModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  selectedMethod?: PaymentMethod;
  currentHolder?: string;
  currentIdentifier?: string;
  allMethods: PaymentMethod[];
  loading?: boolean;
  error?: string;
  onSave: (methodTypeId: number, holder: string, identifier: string) => void;
  onCancel: () => void;
}

export default function PaymentMethodModal({
  visible,
  mode,
  selectedMethod,
  currentHolder = '',
  currentIdentifier = '',
  allMethods,
  loading = false,
  error,
  onSave,
  onCancel,
}: PaymentMethodModalProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<PaymentMethod | null>(selectedMethod || null);
  const [accountHolder, setAccountHolder] = useState(currentHolder);
  const [accountIdentifier, setAccountIdentifier] = useState(currentIdentifier);

  useEffect(() => {
    if (visible) {
      setSelected(selectedMethod || null);
      setAccountHolder(currentHolder);
      setAccountIdentifier(currentIdentifier);
    }
  }, [visible, selectedMethod, currentHolder, currentIdentifier]);

  const handleSave = () => {
    if (!selected) {
      alert('Please select a payment method');
      return;
    }
    onSave(selected.id, accountHolder, accountIdentifier);
  };

  const categorizedMethods = {
    e_wallet: allMethods.filter(m => m.category === 'e_wallet'),
    bank_transfer: allMethods.filter(m => m.category === 'bank_transfer'),
    credit_card: allMethods.filter(m => m.category === 'credit_card'),
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: theme.spacing.lg,
      maxHeight: '80%',
    },
    title: {
      fontSize: 18,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing.lg,
      top: theme.spacing.lg,
    },
    categoryTitle: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    methodButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    selectedMethod: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    methodIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    methodText: {
      flex: 1,
    },
    methodName: {
      fontSize: 13,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    methodDesc: {
      fontSize: 11,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
    },
    detailsSection: {
      marginTop: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    label: {
      fontSize: 12,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      fontFamily: 'DMMono',
      fontSize: 13,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    button: {
      flex: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
            <Text style={styles.title}>
              {mode === 'add' ? 'Add Payment Method' : 'Edit Payment Method'}
            </Text>
            <Pressable style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* E-Wallets */}
            {categorizedMethods.e_wallet.length > 0 && (
              <>
                <Text style={styles.categoryTitle}>E-WALLETS</Text>
                {categorizedMethods.e_wallet.map(method => (
                  <Pressable
                    key={method.id}
                    style={[styles.methodButton, selected?.id === method.id && styles.selectedMethod]}
                    onPress={() => setSelected(method)}
                  >
                    <View style={styles.methodIcon}>
                      {method.logo_path && logoMap[method.logo_path] ? (
                        <Image
                          source={logoMap[method.logo_path]}
                          style={{ width: 24, height: 24, borderRadius: 6 }}
                        />
                      ) : (
                        <Ionicons name={method.icon_name as any} size={18} color={theme.colors.primary} />
                      )}
                    </View>
                    <View style={styles.methodText}>
                      <Text style={styles.methodName}>{method?.name || 'Unknown'}</Text>
                      <Text style={styles.methodDesc}>{method?.description || ''}</Text>
                    </View>
                    {selected?.id === method.id && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {/* Bank Transfers */}
            {categorizedMethods.bank_transfer.length > 0 && (
              <>
                <Text style={styles.categoryTitle}>BANK TRANSFERS</Text>
                {categorizedMethods.bank_transfer.map(method => (
                  <Pressable
                    key={method.id}
                    style={[styles.methodButton, selected?.id === method.id && styles.selectedMethod]}
                    onPress={() => setSelected(method)}
                  >
                    <View style={styles.methodIcon}>
                      {method.logo_path && logoMap[method.logo_path] ? (
                        <Image
                          source={logoMap[method.logo_path]}
                          style={{ width: 24, height: 24, borderRadius: 6 }}
                        />
                      ) : (
                        <Ionicons name={method.icon_name as any} size={18} color={theme.colors.primary} />
                      )}
                    </View>
                    <View style={styles.methodText}>
                      <Text style={styles.methodName}>{method?.name || 'Unknown'}</Text>
                      <Text style={styles.methodDesc}>{method?.description || ''}</Text>
                    </View>
                    {selected?.id === method.id && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {/* Credit Card */}
            {categorizedMethods.credit_card.length > 0 && (
              <>
                <Text style={styles.categoryTitle}>CREDIT CARD</Text>
                {categorizedMethods.credit_card.map(method => (
                  <Pressable
                    key={method.id}
                    style={[styles.methodButton, selected?.id === method.id && styles.selectedMethod]}
                    onPress={() => setSelected(method)}
                  >
                    <View style={styles.methodIcon}>
                      {method.logo_path && logoMap[method.logo_path] ? (
                        <Image
                          source={logoMap[method.logo_path]}
                          style={{ width: 24, height: 24, borderRadius: 6 }}
                        />
                      ) : (
                        <Ionicons name={method.icon_name as any} size={18} color={theme.colors.primary} />
                      )}
                    </View>
                    <View style={styles.methodText}>
                      <Text style={styles.methodName}>{method?.name || 'Unknown'}</Text>
                      <Text style={styles.methodDesc}>{method?.description || ''}</Text>
                    </View>
                    {selected?.id === method.id && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {/* Account Details */}
            {error && (
              <View
                style={{
                  backgroundColor: theme.colors.statusDanger + '20',
                  borderRadius: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.statusDanger,
                  padding: theme.spacing.md,
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
                  {error}
                </Text>
              </View>
            )}

            {selected && (
              <View style={styles.detailsSection}>
                <Text style={styles.label}>Account Holder Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., John Pilot"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                />

                <Text style={styles.label}>Account Identifier (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    selected.category === 'e_wallet'
                      ? 'Phone number or username'
                      : selected.category === 'bank_transfer'
                      ? 'Account number'
                      : 'Card number'
                  }
                  placeholderTextColor={theme.colors.textSecondary}
                  value={accountIdentifier}
                  onChangeText={setAccountIdentifier}
                  secureTextEntry={selected.category === 'credit_card'}
                />

                <View style={styles.buttonContainer}>
                  <View style={styles.button}>
                    <Button
                      label="Cancel"
                      variant="secondary"
                      fullWidth
                      onPress={onCancel}
                      disabled={loading}
                    />
                  </View>
                  <View style={styles.button}>
                    <Button
                      label={loading ? 'Saving...' : mode === 'add' ? 'Add Method' : 'Update Method'}
                      variant="primary"
                      fullWidth
                      onPress={handleSave}
                      disabled={loading}
                    />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
