import { useTheme } from '@/constants/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface NavItem {
  label: string;
  icon: string;
  href: string;
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

  // Determine active tab based on current route
  const currentRoute = `/(tabs)/${segments[1] || ''}`.replace(/\/$/, '');
  const activeIndex = navItems.findIndex(
    (item) => item.href === '/(tabs)' && currentRoute === '/(tabs)/'
      ? true
      : item.href === currentRoute
  );

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
              onPress={() => router.push(item.href)}
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
            onPress={() => router.push(item.href)}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
