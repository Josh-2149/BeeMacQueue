// app/(customer)/my-queue.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQueueContext } from '../../context/QueueContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { QueueTicketCard } from '../../components/QueueTicketCard';
import { SectionLabel } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { CustomerHeader } from '../../components/CustomerHeader';
import { COLORS, BRAND } from '../../lib/constants';
import { PhosphorIcon } from '../../components/PhosphorIcon';
import { QueueEntry } from '../../types';
import { supabase } from '../../lib/supabase';

console.log('👤 [Customer MyQueue] Screen mounted');

// ✅ FIXED: Removed extra properties from cancelled
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  waiting:    { color: COLORS.blue,   bg: COLORS.blueLight,   icon: 'Clock' },
  serving:    { color: COLORS.orange, bg: COLORS.orangeLight, icon: 'UserCircle' },
  completed:  { color: COLORS.green,  bg: COLORS.greenLight,  icon: 'CheckCircle' },
  cancelled:  { color: '#DC2626',     bg: '#FEF2F2',          icon: 'XCircle' },
  no_show:    { color: COLORS.red,    bg: COLORS.redLight,    icon: 'WarningCircle' },
};

export default function CustomerMyQueueScreen() {
  console.log('👤 [Customer MyQueue] Rendering');
  const {
    activeQueue,
    history,
    loading,
    leaveQueue,
    refreshActive,
    peopleAhead,
    isYourTurn,
    estimatedWaitMins,
  } = useQueueContext();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function getStatusConfig(status: string) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
  }

  async function handleDeleteHistory(entryId: string) {
    const choice = await showConfirm({
      title: 'Delete Entry',
      message: 'Remove this from your history? This cannot be undone.',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Delete', style: 'destructive' },
      ],
    });

    if (choice !== 'Delete') return;

    setDeletingIds((prev) => new Set(prev).add(entryId));
    try {
      const { error } = await supabase
        .from('queue_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      await refreshActive();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to delete entry', variant: 'error' });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  }

  async function handleClearAllHistory() {
    if (history.length === 0) return;

    const choice = await showConfirm({
      title: 'Clear All History',
      message: `Remove all ${history.length} entries from your history?`,
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Clear All', style: 'destructive' },
      ],
    });

    if (choice !== 'Clear All') return;

    try {
      const userId = history[0]?.user_id;
      if (!userId) return;

      const { error } = await supabase
        .from('queue_entries')
        .delete()
        .in('status', ['completed', 'cancelled'])
        .eq('user_id', userId);

      if (error) throw error;
      await refreshActive();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to clear history', variant: 'error' });
    }
  }

  return (
    <SafeScreen style={styles.container}>
      <CustomerHeader
        title="My Queue"
        subtitle="Your active ticket and history"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Ticket */}
        {activeQueue ? (
          <>
            <SectionLabel>Active Ticket</SectionLabel>
            <QueueTicketCard
              queue={activeQueue}
              onLeave={leaveQueue}
              onRefresh={refreshActive}
              peopleAhead={peopleAhead}
              isYourTurn={isYourTurn}
              estimatedWaitMins={estimatedWaitMins}
            />
          </>
        ) : (
          <View style={styles.noActive}>
            <PhosphorIcon icon="Ticket" size={44} color={COLORS.gray300} weight="bold" />
            <Text style={styles.noActiveTitle}>No active ticket</Text>
            <Text style={styles.noActiveSub}>
              Go to Home and join a queue at Jollibee or McDonald's
            </Text>
          </View>
        )}

        {/* Queue History Header */}
        <View style={styles.historyHeader}>
          <SectionLabel>Queue History</SectionLabel>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearAllHistory} activeOpacity={0.7}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={COLORS.red} size="large" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <PhosphorIcon icon="List" size={44} color={COLORS.gray300} weight="bold" />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySub}>Your past tickets will appear here</Text>
          </View>
        ) : (
          history.map((entry: QueueEntry) => {
            const brand = entry.establishment?.brand ?? 'jollibee';
            const statusConfig = getStatusConfig(entry.status);
            const isDeleting = deletingIds.has(entry.id);

            return (
              <View key={entry.id} style={styles.histCard}>
                <View style={styles.histTop}>
                  <View style={styles.histLeft}>
                    <View style={styles.histBrandRow}>
                      <View style={[styles.brandDot, { backgroundColor: BRAND[brand]?.color || COLORS.red }]} />
                      <View style={styles.histBrandInfo}>
                        <Text style={styles.histBrandName}>
                          {entry.establishment?.name} · {entry.establishment?.branch}
                        </Text>
                        {entry.queue && (
                          <Text style={styles.histQueueName}>
                            {entry.queue.name}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text style={styles.histDate}>{formatDate(entry.created_at)}</Text>
                  </View>

                  {/* Status Badge with Phosphor Icon */}
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <PhosphorIcon 
                      icon={statusConfig.icon} 
                      size={12} 
                      color={statusConfig.color} 
                      weight="bold" 
                    />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Ticket Number */}
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketHash}>#</Text>
                  <Text style={styles.ticketNumber}>{entry.ticket_number}</Text>
                </View>

                {/* Served Info */}
                {entry.status === 'completed' && entry.served_at && (
                  <View style={styles.servedInfo}>
                    <PhosphorIcon icon="CheckCircle" size={14} color={COLORS.green} weight="fill" />
                    <Text style={styles.servedText}>
                      Served at {formatDate(entry.served_at)}
                    </Text>
                  </View>
                )}

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteHistory(entry.id)}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color={COLORS.red} />
                  ) : (
                    <>
                      <PhosphorIcon icon="Trash" size={14} color={COLORS.red} weight="bold" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </>
                  )}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 36,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noActive: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  noActiveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  noActiveSub: {
    fontSize: 13,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.red,
    marginBottom: 10,
    marginTop: 4,
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
  },
  histCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  histTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  histLeft: {
    flex: 1,
    marginRight: 10,
  },
  histBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  histBrandInfo: {
    flex: 1,
  },
  histBrandName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  histQueueName: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
  },
  histDate: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ticketHash: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.red,
    marginRight: 2,
    marginTop: 2,
  },
  ticketNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.red,
    letterSpacing: -2,
    lineHeight: 44,
  },
  servedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  servedText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingVertical: 6,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.red,
  },
});