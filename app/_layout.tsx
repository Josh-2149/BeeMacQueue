import { LogBox } from 'react-native';
LogBox.ignoreLogs(["Can't perform a React state update"]);

import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { NotificationProvider } from '../context/NotificationContext';
import { QueueProvider } from '../context/QueueContext';
import { StaffQueueProvider } from '../context/StaffQueueContext';
import { ToastProvider } from '../context/ToastContext';
import { ConfirmProvider } from '../context/ConfirmContext';
import { COLORS } from '../lib/constants';

console.log('🏠 [RootLayout] Module loaded');

export default function RootLayout() {
  console.log('🏠 [RootLayout] Rendering');
  const { session, profile, loading, initialized } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const redirecting = useRef(false);
  const prevRole = useRef<string | undefined>(undefined);

  useEffect(() => {
    console.log(`🏠 [RootLayout] 📊 Effect: loading=${loading}, initialized=${initialized}, session=${!!session}, segment=${segments[0]}, role=${profile?.role || 'undefined'}`);
    
    // ✅ Don't do anything until fully initialized
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

    // No session → go to auth
    if (!session) {
      if (!inAuth) {
        console.log('🏠 [RootLayout] 🚫 No session, redirecting to login');
        redirecting.current = true;
        prevRole.current = undefined;
        router.replace('/(auth)/login');
        setTimeout(() => { redirecting.current = false; }, 500);
      }
      return;
    }

    // ✅ Session exists but profile not ready → WAIT, don't redirect yet
    if (!profile) {
      console.log('🏠 [RootLayout] ⏳ Profile not loaded yet, waiting...');
      return;
    }

    // ✅ Session exists but role is undefined → WAIT (profile just created, role might not be set)
    if (!profile.role) {
      console.log('🏠 [RootLayout] ⏳ Profile role not set yet, waiting...');
      return;
    }

    // ✅ Only redirect if role actually changed or we're on the wrong screen
    const correctSegment = profile.role === 'staff' ? '(staff)' : '(customer)';
    const currentSegment = segments[0];

    if (inAuth || currentSegment !== correctSegment) {
      // Prevent duplicate redirects to same place
      if (prevRole.current === profile.role && currentSegment === correctSegment) {
        console.log('🏠 [RootLayout] ✅ Already on correct screen, skipping redirect');
        return;
      }

      prevRole.current = profile.role;
      const target = profile.role === 'staff' ? '/(staff)/dashboard' : '/(customer)/home';
      console.log(`🏠 [RootLayout] 👉 Redirecting to ${target} (role: ${profile.role})`);
      redirecting.current = true;
      router.replace(target);
      setTimeout(() => { redirecting.current = false; }, 500);
    }
  }, [session, profile, loading, initialized, segments, router]);

  // ✅ Show spinner until FULLY initialized with role confirmed
  if (loading || !initialized || (session && !profile?.role)) {
    console.log('🏠 [RootLayout] ⏳ Showing spinner (loading, not initialized, or profile role still pending)');
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
    <ToastProvider>
      <ConfirmProvider>
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
      </ConfirmProvider>
    </ToastProvider>
  );
}