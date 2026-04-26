import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="grinds" />
      <Stack.Screen name="log-grind" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="pricing-setup" />
    </Stack>
  );
}
