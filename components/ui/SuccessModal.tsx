import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export function SuccessModal({
  visible,
  title,
  message,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 2000,
}: SuccessModalProps) {
  const theme = useTheme();

  useEffect(() => {
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, autoCloseDuration, onDismiss]);

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
      borderColor: theme.colors.statusSuccess,
    },
    titleText: {
      fontSize: 18,
      fontFamily: 'DMMono-Medium',
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
    dismissButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.statusSuccess,
      borderWidth: 1.5,
      borderColor: theme.colors.statusSuccess,
    },
    dismissButtonText: {
      fontSize: 14,
      fontFamily: 'DMMono-Medium',
      fontWeight: 'bold',
      color: '#ffffff',
    },
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.statusSuccess} />
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Message */}
          <Text style={styles.messageText}>{message}</Text>

          {/* Dismiss Button */}
          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
