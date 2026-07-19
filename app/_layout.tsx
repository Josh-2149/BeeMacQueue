import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { NotificationProvider } from '../context/NotificationContext';
import { QueueProvider } from '../context/QueueContext';
import { StaffQueueProvider } from '../context/StaffQueueContext';
import { COLORS } from '../lib/constants';

console.log('🏠 [RootLayout] Module loaded');

export default function RootLayout() {
  console.log('🏠 [RootLayout] Rendering');
  const { session, profile, loading, initialized } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const redirecting = useRef(false);

  useEffect(() => {
    console.log(`🏠 [RootLayout] 📊 Effect: loading=${loading}, initialized=${initialized}, session=${!!session}, segment=${segments[0]}, role=${profile?.role || 'undefined'}`);
    
    if (loading || !initialized) {
      console.log('🏠 [RootLayout] ⏳ Waiting for initialization...');
      return;
    }

    if (redirecting.current) {
      console.log('🏠 [RootLayout] ⏳ Already redirecting, skipping...');
      return;
    }

    const inAuth = segments[0] === '(auth)';
    console.log(`🏠 [RootLayout] 🔄 inAuth=${inAuth}, hasSession=${!!session}`);

    if (!session) {
      if (!inAuth) {
        console.log('🏠 [RootLayout] 🚫 No session, redirecting to login');
        redirecting.current = true;
        router.replace('/(auth)/login');
        setTimeout(() => { redirecting.current = false; }, 500);
      }
      return;
    }

    if (session && inAuth) {
      if (!profile) {
        console.log('🏠 [RootLayout] ⏳ Profile not loaded yet, waiting...');
        return;
      }
      
      console.log(`🏠 [RootLayout] 🎯 Profile role: ${profile.role}`);
      
      if (profile.role === 'staff') {
        console.log('🏠 [RootLayout] 👉 Redirecting to STAFF dashboard');
        redirecting.current = true;
        router.replace('/(staff)/dashboard');
        setTimeout(() => { redirecting.current = false; }, 500);
      } else {
        console.log('🏠 [RootLayout] 👉 Redirecting to CUSTOMER home');
        redirecting.current = true;
        router.replace('/(customer)/home');
        setTimeout(() => { redirecting.current = false; }, 500);
      }
    }
  }, [session, profile, loading, initialized, segments, router]);

  if (loading || !initialized) {
    console.log('🏠 [RootLayout] ⏳ Showing spinner');
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.red} />
          <Text style={{ marginTop: 12, color: COLORS.gray500, fontSize: 14 }}>Loading...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  console.log('🏠 [RootLayout] ✅ Rendering main app');
  return (
    <NotificationProvider>
      <QueueProvider>
        <StaffQueueProvider>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(customer)" />
              <Stack.Screen name="(staff)" />
            </Stack>
          </SafeAreaProvider>
        </StaffQueueProvider>
      </QueueProvider>
    </NotificationProvider>
  );
}