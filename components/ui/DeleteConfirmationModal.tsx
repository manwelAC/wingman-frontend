import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface DeleteConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  visible,
  title,
  message,
  loading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const theme = useTheme();

  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      width: '85%',
      maxWidth: 350,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    titleText: {
      fontSize: 18,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    messageText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
    },
    cancelButton: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    cancelButtonText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    confirmButtonText: {
      fontSize: 14,
      fontFamily: 'DMMono',
      fontWeight: 'bold',
      color: '#ffffff',
    },
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="trash" size={32} color={theme.colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Message */}
          <Text style={styles.messageText}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.confirmButtonText}>Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
