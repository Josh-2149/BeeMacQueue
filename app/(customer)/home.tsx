// app/(customer)/home.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useCustomerQueues } from '../../hooks/useCustomerQueues';
import { useQueueContext } from '../../context/QueueContext';
import { QueueTicketCard } from '../../components/QueueTicketCard';
import { CustomerQueueCard } from '../../components/CustomerQueueCard';
import { BranchSectionHeader } from '../../components/BranchSectionHeader';
import { FilterBar } from '../../components/FilterBar';
import { SafeScreen } from '../../components/SafeScreen';
import { CustomerHeader } from '../../components/CustomerHeader';
import { SectionLabel } from '../../components/ui';
import { COLORS } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { Queue } from '../../types';

console.log('🏠 [Customer Home] Screen mounted');

export default function CustomerHomeScreen() {
  console.log('🏠 [Customer Home] Rendering');
  const router = useRouter();
  const { profile } = useAuth();
  const { groupedQueues, loading, refresh: refreshQueues } = useCustomerQueues();
  const {
    activeQueue,
    joining,
    joinQueue,
    leaveQueue,
    refreshActive,
    completedTodayQueueIds,
  } = useQueueContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [joiningQueueId, setJoiningQueueId] = useState<string | null>(null);

  // Redirect staff to dashboard
  useEffect(() => {
    if (profile?.role === 'staff') {
      router.replace('/(staff)/dashboard');
    }
  }, [profile]);

  // Filter groups by brand
  const filteredGroups = useMemo(() => {
    if (selectedBrand === 'all') return groupedQueues;
    return groupedQueues.filter((group) => group.brand === selectedBrand);
  }, [groupedQueues, selectedBrand]);

  // Filter options for FilterBar
  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'jollibee', label: '🐝 Jollibee' },
    { key: 'mcdo', label: '🍟 McDonald\'s' },
  ];

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refreshQueues(), refreshActive()]);
    setRefreshing(false);
  }

  async function handleJoin(queue: Queue) {
    // Already in this queue
    if (activeQueue?.queue_id === queue.id) {
      Alert.alert(
        'Already Here!',
        `You're already in this queue with ticket #${activeQueue.ticket_number}.`
      );
      return;
    }

    // Already served today
    if (completedTodayQueueIds.includes(queue.id)) {
      Alert.alert(
        'Served Today',
        'You\'ve already been served in this queue today. Please come back tomorrow!'
      );
      return;
    }

    // Has active queue elsewhere
    if (activeQueue) {
      Alert.alert(
        'Already in Queue',
        `You have ticket #${activeQueue.ticket_number} at another queue. Leave it first to join here.`
      );
      return;
    }

    setJoiningQueueId(queue.id);
    try {
      const ticket = await joinQueue(queue.id);
      const branchName = queue.establishment?.name || 'branch';
      Alert.alert(
        '🎫 Joined!',
        `Ticket #${ticket} for "${queue.name}" at ${branchName}.`
      );
    } catch (e: any) {
      Alert.alert('Could not join', e.message);
    } finally {
      setJoiningQueueId(null);
    }
  }

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeScreen style={styles.container}>
        <CustomerHeader
          title="Find a Queue"
          subtitle="Browse all Jollibee & McDonald's branches in CDO"
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
          <Text style={styles.loadingText}>Loading queues...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <CustomerHeader
        title="Find a Queue"
        subtitle="Browse all Jollibee & McDonald's branches in CDO"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.red}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active Ticket Section */}
        {activeQueue && (
          <>
            <SectionLabel>Your Active Ticket</SectionLabel>
            <QueueTicketCard
              queue={activeQueue}
              onLeave={leaveQueue}
              onRefresh={refreshActive}
            />
          </>
        )}

        {/* Available Queues Section */}
        <SectionLabel>Available Queues</SectionLabel>

        {/* Brand Filter */}
        <FilterBar
          filters={filterOptions}
          active={selectedBrand}
          onSelect={setSelectedBrand}
        />

        {/* Queue Groups by Branch */}
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <PhosphorIcon icon="Queue" size={48} color={COLORS.gray300} weight="bold" />
            <Text style={styles.emptyTitle}>No active queues</Text>
            <Text style={styles.emptySub}>
              {selectedBrand === 'all'
                ? 'Check back later for available queues'
                : `No ${selectedBrand === 'jollibee' ? 'Jollibee' : "McDonald's"} queues available`}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.establishmentId}>
              <BranchSectionHeader
                brand={group.brand}
                branch={group.branch}
                queueCount={group.queues.length}
              />
              
              {group.queues.map((queue) => {
                const isThisQueue = activeQueue?.queue_id === queue.id;
                const isServedToday = completedTodayQueueIds.includes(queue.id);
                const isJoiningThis = joiningQueueId === queue.id;
                const hasActiveElsewhere = !!activeQueue && !isThisQueue;

                return (
                  <CustomerQueueCard
                    key={queue.id}
                    queue={queue}  // ← queue now has isFull property
                    onJoin={() => handleJoin(queue)}
                    isUserQueue={isThisQueue}
                    isServedToday={isServedToday}
                    isJoining={isJoiningThis}
                    hasActiveElsewhere={hasActiveElsewhere}
                  />
                );
              })}
            </View>
          ))
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BeeMacQueue CDO</Text>
          <Text style={styles.footerSub}>Real-time queue management</Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray600,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.gray400,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: COLORS.gray400,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 8,
    color: COLORS.gray300,
    marginTop: 2,
  },
});