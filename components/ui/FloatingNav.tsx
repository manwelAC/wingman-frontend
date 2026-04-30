import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AIChat from './AIChat';

interface NavItem {
  label: string;
  icon: string;
  href: "/(tabs)" | "/(tabs)/grinds" | "/(tabs)/log-grind" | "/(tabs)/customers" | "/(tabs)/pricing-setup";
}

const navItems: NavItem[] = [
  { label: 'Home', icon: 'home', href: '/(tabs)' },
  { label: 'Grinds', icon: 'wallet', href: '/(tabs)/grinds' },
  { label: 'Log', icon: 'game-controller', href: '/(tabs)/log-grind' },
  { label: 'Customers', icon: 'person-add', href: '/(tabs)/customers' },
  { label: 'Pricing', icon: 'pricetag', href: '/(tabs)/pricing-setup' },
];

export default function FloatingNav() {
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'log' | 'ai' | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const isLongPress = useRef(false);

  // Determine active tab based on current route
  const currentRoute = `/(tabs)/${segments[1] || ''}`.replace(/\/$/, '');
  const activeIndex = navItems.findIndex(
    (item) => item.href === '/(tabs)' && currentRoute === '/(tabs)/'
      ? true
      : item.href === currentRoute
  );

  const handleLogPressIn = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowLogModal(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }, 500); // 500ms long press
  };

  const handleLogPressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleLogPress = () => {
    // Only navigate if it wasn't a long press
    if (!isLongPress.current && !showLogModal) {
      router.push('/(tabs)/log-grind');
    }
  };

  const handleOptionSelect = (option: 'log' | 'ai') => {
    isLongPress.current = false;
    setSelectedOption(option);

    // Animate modal closing
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLogModal(false);
      scaleAnim.setValue(0);

      if (option === 'log') {
        router.push('/(tabs)/log-grind');
      } else if (option === 'ai') {
        setShowAIChat(true);
      }

      setSelectedOption(null);
    });
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 24,
      left: 24,
      right: 24,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: 64,
      paddingHorizontal: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 5,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    logGrindButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {navItems.map((item, index) => {
        const isActive = index === activeIndex;
        const isLogButton = item.label === 'Log';

        if (isLogButton) {
          return (
            <Pressable
              key={item.href}
              style={styles.logGrindButton}
              onPressIn={handleLogPressIn}
              onPressOut={handleLogPressOut}
              onPress={handleLogPress}
            >
              <Ionicons
                name={item.icon as any}
                size={28}
                color="white"
              />
            </Pressable>
          );
        }

        return (
          <Pressable
            key={item.href}
            style={styles.navItem}
            onPress={() => {
              if (!isActive) {
                router.push(item.href);
              }
            }}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
          </Pressable>
        );
      })}

      {/* Log Options Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowLogModal(false);
          scaleAnim.setValue(0);
          setSelectedOption(null);
        }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            setShowLogModal(false);
            scaleAnim.setValue(0);
            setSelectedOption(null);
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            }}
          >
            <Pressable
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                paddingVertical: theme.spacing.lg,
                paddingHorizontal: theme.spacing.lg,
                gap: theme.spacing.md,
                minWidth: 240,
              }}
              onPress={() => {
                // Prevent closing when clicking inside modal
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'DMMono-Medium',
                  fontWeight: 'bold',
                  color: theme.colors.textPrimary,
                  textAlign: 'center',
                  marginBottom: theme.spacing.sm,
                }}
              >
                Choose Action
              </Text>

              {/* Log Grind Option */}
              <Pressable
                style={{
                  backgroundColor: selectedOption === 'log' ? theme.colors.primary : theme.colors.primary + '30',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
                onPress={() => handleOptionSelect('log')}
              >
                <Ionicons
                  name="game-controller"
                  size={20}
                  color={selectedOption === 'log' ? '#FFFFFF' : theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'DMMono-Medium',
                    fontWeight: 'bold',
                    color: selectedOption === 'log' ? '#FFFFFF' : theme.colors.primary,
                  }}
                >
                  Log Grind
                </Text>
              </Pressable>

              {/* AI Chat Option */}
              <Pressable
                style={{
                  backgroundColor: selectedOption === 'ai' ? theme.colors.primary : theme.colors.primary + '30',
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary,
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
                onPress={() => handleOptionSelect('ai')}
              >
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={selectedOption === 'ai' ? '#FFFFFF' : theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'DMMono-Medium',
                    fontWeight: 'bold',
                    color: selectedOption === 'ai' ? '#FFFFFF' : theme.colors.primary,
                  }}
                >
                  AI Assistant
                </Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* AI Chat Component */}
      <AIChat visible={showAIChat} onClose={() => setShowAIChat(false)} />
    </View>
  );
}
