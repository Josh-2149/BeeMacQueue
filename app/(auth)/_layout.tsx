import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

console.log('🔵 Auth layout mounted');

export default function AuthLayout() {
  console.log('🔄 Auth layout rendering');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.redDark }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}