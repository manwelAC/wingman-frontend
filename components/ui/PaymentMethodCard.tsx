import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PaymentMethodCardProps {
  id: number;
  name: string;
  icon: string;
  accountHolder?: string;
  accountIdentifier?: string;
  isActive?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onToggle?: (id: number, isActive: boolean) => void;
}

export default function PaymentMethodCard({
  id,
  name,
  icon,
  accountHolder,
  accountIdentifier,
  isActive = true,
  onEdit,
  onDelete,
  onToggle,
}: PaymentMethodCardProps) {
  const theme = useTheme();

  const maskIdentifier = (identifier: string | undefined) => {
    if (!identifier) return '';
    if (identifier.length <= 4) return identifier;
    const start = identifier.substring(0, 3);
    const end = identifier.substring(identifier.length - 3);
    const masked = '*'.repeat(identifier.length - 6);
    return `${start}${masked}${end}`;
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: isActive ? theme.colors.surface : theme.colors.surface + '80',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      opacity: isActive ? 1 : 0.6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    methodInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    methodName: {
      fontSize: 14,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    details: {
      marginLeft: 48,
      marginBottom: theme.spacing.sm,
    },
    detailRow: {
      fontSize: 12,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      justifyContent: 'flex-end',
    },
    actionButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: theme.colors.primary + '20',
    },
    actionButtonText: {
      fontSize: 11,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    deleteButton: {
      backgroundColor: theme.colors.statusDanger + '20',
    },
    deleteButtonText: {
      color: theme.colors.statusDanger,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.methodInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.methodName}>{name}</Text>
          </View>
        </View>
      </View>

      {(accountHolder || accountIdentifier) && (
        <View style={styles.details}>
          {accountHolder && <Text style={styles.detailRow}>Holder: {accountHolder}</Text>}
          {accountIdentifier && (
            <Text style={styles.detailRow}>ID: {maskIdentifier(accountIdentifier)}</Text>
          )}
        </View>
      )}

      <View style={styles.actions}>
        {onToggle && (
          <Pressable
            style={[styles.actionButton, !isActive && { backgroundColor: theme.colors.statusSuccess + '20' }]}
            onPress={() => onToggle(id, !isActive)}
          >
            <Text style={[styles.actionButtonText, !isActive && { color: theme.colors.statusSuccess }]}>
              {isActive ? 'Disable' : 'Enable'}
            </Text>
          </Pressable>
        )}
        {onEdit && (
          <Pressable style={styles.actionButton} onPress={() => onEdit(id)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>
        )}
        {onDelete && (
          <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => onDelete(id)}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
