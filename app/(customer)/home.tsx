// app/(customer)/home.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerQueues } from '../../hooks/useCustomerQueues';
import { useQueueContext } from '../../context/QueueContext';
import { QueueTicketCard } from '../../components/QueueTicketCard';
import { SafeScreen } from '../../components/SafeScreen';
import CustomerHeader from '../../components/CustomerHeader';
import { COLORS, BRAND } from '../../lib/constants';
import { Queue } from '../../types';
import { Ionicons } from '@expo/vector-icons';

console.log('🏠 [Customer Home] Screen mounted');

export default function CustomerHomeScreen() {
  console.log('🏠 [Customer Home] Rendering');
  const router = useRouter();
  const { profile } = useAuth();
  const { queues, loading, refresh: refreshQueues } = useCustomerQueues();
  const {
    activeQueue, joining,
    joinQueue, leaveQueue, refreshActive,
  } = useQueueContext();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.role === 'staff') {
      router.replace('/(staff)/dashboard');
    }
  }, [profile]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refreshQueues(), refreshActive()]);
    setRefreshing(false);
  }

  async function handleJoin(queue: Queue) {
    if (activeQueue) {
      Alert.alert(
        'Already in queue',
        `You have ticket #${activeQueue.ticket_number}. Leave it first.`
      );
      return;
    }
    try {
      const ticket = await joinQueue(queue.id);
      Alert.alert('🎫 Joined!', `Ticket #${ticket} for "${queue.name}" at ${queue.establishment?.name || 'branch'}.`);
    } catch (e: any) {
      Alert.alert('Could not join', e.message);
    }
  }

  if (profile?.role === 'staff') {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Redirecting to dashboard...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <CustomerHeader title="BeeMacQueue" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />}
      >
        {activeQueue && (
          <>
            <Text style={styles.sectionLabel}>YOUR ACTIVE TICKET</Text>
            <QueueTicketCard
              queue={activeQueue}
              onLeave={leaveQueue}
              onRefresh={refreshActive}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>AVAILABLE QUEUES</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading queues...</Text>
        ) : queues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No active queues</Text>
            <Text style={styles.emptySub}>Check back later</Text>
          </View>
        ) : (
          queues.map((q) => {
            const brand = q.establishment?.brand || 'jollibee';
            const brandInfo = BRAND[brand];
            return (
              <View key={q.id} style={styles.queueCard}>
                <View style={styles.queueHeader}>
                  <View style={styles.brandBadge}>
                    <Text style={styles.brandEmoji}>{brandInfo?.emoji}</Text>
                  </View>
                  <View style={styles.queueInfo}>
                    <Text style={styles.queueName}>{q.name}</Text>
                    <Text style={styles.branchName}>{q.establishment?.name} · {q.establishment?.branch}</Text>
                  </View>
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingCount}>{q.waitingCount || 0}</Text>
                    <Text style={styles.waitingLabel}>waiting</Text>
                  </View>
                </View>
                <View style={styles.queueDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.gray500} />
                    <Text style={styles.detailText}>~{q.estimated_wait_mins || 15} min</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.gray500} />
                    <Text style={styles.detailText}>Capacity {q.capacity || 50}</Text>
                  </View>
                </View>
                {q.description && (
                  <Text style={styles.description}>{q.description}</Text>
                )}
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoin(q)}
                  disabled={joining}
                >
                  <Text style={styles.joinButtonText}>
                    {joining ? 'Joining...' : 'Join Queue'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: COLORS.gray500 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray600, marginTop: 10 },
  emptySub: { fontSize: 14, color: COLORS.gray400, marginTop: 4 },
  queueCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  queueHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandEmoji: { fontSize: 18 },
  queueInfo: { flex: 1 },
  queueName: { fontSize: 16, fontWeight: '700', color: COLORS.gray900 },
  branchName: { fontSize: 12, color: COLORS.gray500, marginTop: 1 },
  waitingBadge: { alignItems: 'center' },
  waitingCount: { fontSize: 20, fontWeight: '800', color: COLORS.red },
  waitingLabel: { fontSize: 9, color: COLORS.gray400, textTransform: 'uppercase' },
  queueDetails: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: COLORS.gray600 },
  description: { fontSize: 12, color: COLORS.gray500, marginBottom: 10 },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.red,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  joinButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});