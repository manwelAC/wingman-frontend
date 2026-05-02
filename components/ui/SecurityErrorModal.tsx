import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface SecurityErrorModalProps {
  visible: boolean;
  type: 'vpn' | 'location' | 'error';
  title: string;
  message: string;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function SecurityErrorModal({
  visible,
  type,
  title,
  message,
  onDismiss,
  actionLabel = 'OK',
  onAction,
}: SecurityErrorModalProps) {
  const theme = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'vpn':
        return 'shield-checkmark';
      case 'location':
        return 'location';
      case 'error':
      default:
        return 'alert-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'vpn':
        return theme.colors.statusDanger;
      case 'location':
        return theme.colors.primary;
      case 'error':
      default:
        return theme.colors.statusDanger;
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onDismiss();
  };

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
      borderColor: getIconColor(),
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
    actionButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getIconColor(),
      borderWidth: 1.5,
      borderColor: getIconColor(),
    },
    actionButtonText: {
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
      <Pressable style={styles.centeredView} onPress={onDismiss}>
        <Pressable style={styles.modalView} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIcon()}
              size={32}
              color={getIconColor()}
            />
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Message */}
          <Text style={styles.messageText}>{message}</Text>

          {/* Action Button */}
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleAction}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
