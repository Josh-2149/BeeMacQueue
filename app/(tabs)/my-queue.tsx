import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useQueue } from '../../hooks/useQueue';
import { QueueTicketCard } from '../../components/QueueTicketCard';
import { SectionLabel, EmptyState, Badge } from '../../components/ui';
import { COLORS, BRAND } from '../../lib/constants';
import { QueueEntry } from '../../types';

const STATUS_BADGE: Record<string, 'blue' | 'orange' | 'green' | 'gray'> = {
  waiting: 'blue', serving: 'orange', served: 'green', cancelled: 'gray',
};

export default function MyQueueScreen() {
  const { user } = useAuth();
  const { activeQueue, history, loading, leaveQueue, refreshActive } = useQueue(user?.id);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Queue</Text>
        <Text style={styles.headerSub}>Your active ticket and history</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeQueue ? (
          <>
            <SectionLabel>ACTIVE TICKET</SectionLabel>
            <QueueTicketCard
              queue={activeQueue}
              onLeave={leaveQueue}
              onRefresh={refreshActive}
            />
          </>
        ) : (
          <View style={styles.noActive}>
            <Text style={styles.noActiveIcon}>🎫</Text>
            <Text style={styles.noActiveTitle}>No active ticket</Text>
            <Text style={styles.noActiveSub}>
              Go to Home and join a queue at Jollibee or McDonald's
            </Text>
          </View>
        )}

        <SectionLabel>QUEUE HISTORY</SectionLabel>

        {loading ? (
          <ActivityIndicator color={COLORS.red} style={{ marginTop: 20 }} />
        ) : history.length === 0 ? (
          <EmptyState icon="📋" title="No history yet" sub="Your past tickets will appear here" />
        ) : (
          history.map((entry: QueueEntry) => {
            const brand = entry.establishment?.brand ?? 'jollibee';
            return (
              <View key={entry.id} style={styles.histCard}>
                <View style={styles.histTop}>
                  <View style={styles.histLeft}>
                    <Text style={styles.histBrand}>
                      {BRAND[brand]?.emoji} {entry.establishment?.name} · {entry.establishment?.branch}
                    </Text>
                    <Text style={styles.histDate}>{formatDate(entry.created_at)}</Text>
                  </View>
                  <Badge
                    label={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    variant={STATUS_BADGE[entry.status] ?? 'gray'}
                  />
                </View>
                <Text style={styles.histTicket}>#{entry.ticket_number}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.red, paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  noActive: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 28,
    alignItems: 'center', marginBottom: 20,
  },
  noActiveIcon: { fontSize: 44, marginBottom: 12 },
  noActiveTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray700, marginBottom: 6 },
  noActiveSub: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
  histCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  histTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  histLeft: { flex: 1, marginRight: 10 },
  histBrand: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 3 },
  histDate: { fontSize: 11, color: COLORS.gray400 },
  histTicket: { fontSize: 36, fontWeight: '900', color: COLORS.red, letterSpacing: -1 },
});
