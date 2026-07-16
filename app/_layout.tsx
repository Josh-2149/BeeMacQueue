import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../lib/constants';

console.log('🔵 RootLayout mounted');

export default function RootLayout() {
  console.log('🔄 RootLayout rendering');
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('📊 Auth state changed:', { session: !!session, loading, segment: segments[0] });
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    console.log(`🔄 Navigation: inAuth=${inAuth}, hasSession=${!!session}`);
    if (!session && !inAuth) {
      console.log('🔄 No session, redirecting to login');
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      console.log('🔄 Session exists, redirecting to home');
      router.replace('/(tabs)/home');
    }
  }, [session, loading, segments]);

  if (loading) {
    console.log('⏳ Loading state, showing spinner');
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top']}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.red} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  console.log('✅ Rendering main app with navigation');
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}