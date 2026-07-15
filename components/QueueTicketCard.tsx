import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { QueueEntry } from '../types';
import { COLORS, BRAND } from '../lib/constants';

interface Props {
  queue: QueueEntry;
  onLeave: () => void;
  onRefresh: () => void;
}

export function QueueTicketCard({ queue, onLeave, onRefresh }: Props) {
  const est = queue.establishment;
  const brand = est?.brand ? BRAND[est.brand] : null;
  const ticket = queue.ticket_number;
  const serving = est?.next_serving ?? 1;
  const ahead = Math.max(0, ticket - serving);
  const isNext = ahead === 0;
  const estWait = ahead * (est?.avg_wait_mins ?? 5);
  const total = Math.max(ticket, est?.current_queue ?? ticket);
  const progress = Math.min(97, Math.max(5, ((ticket - ahead) / Math.max(total, 1)) * 100));

  function confirmLeave() {
    Alert.alert('Leave queue?', "You'll lose your spot and can't get it back.", [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: onLeave },
    ]);
  }

  return (
    <View style={[styles.card, isNext && styles.cardActive]}>
      <View style={[styles.brandHeader, { backgroundColor: brand?.color ?? COLORS.red }]}>
        <Text style={styles.brandHeaderText}>
          {brand?.emoji} {est?.name} · {est?.branch}
        </Text>
        {isNext && <Text style={styles.brandHeaderBadge}>🎉 YOUR TURN</Text>}
      </View>

      <View style={styles.body}>
        <View style={styles.ticketRow}>
          <View>
            <Text style={styles.ticketLabel}>YOUR TICKET</Text>
            <Text style={styles.ticketNum}>#{ticket}</Text>
          </View>
          <View style={styles.ticketRight}>
            <Text style={styles.servingLabel}>NOW SERVING</Text>
            <Text style={styles.servingNum}>#{serving}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            {
              width: `${progress}%` as any,
              backgroundColor: isNext ? COLORS.green : COLORS.red,
            },
          ]} />
        </View>

        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{ahead} ahead of you</Text>
          <Text style={[
            styles.progressText,
            { fontWeight: '700', color: isNext ? COLORS.green : COLORS.red },
          ]}>
            {isNext ? '🎉 Head to the counter!' : `~${estWait} min${estWait !== 1 ? 's' : ''} away`}
          </Text>
        </View>

        {isNext && (
          <View style={styles.turnAlert}>
            <Text style={styles.turnAlertText}>
              ✅ Please proceed to the counter now!
            </Text>
          </View>
        )}

        <Text style={styles.address}>📍 {est?.address}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveBtn} onPress={confirmLeave}>
            <Text style={styles.leaveBtnText}>Leave Queue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: 18, marginBottom: 16,
    shadowColor: COLORS.red, shadowOpacity: 0.12, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
    overflow: 'hidden', borderWidth: 2, borderColor: COLORS.red,
  },
  cardActive: { borderColor: COLORS.green, shadowColor: COLORS.green },
  brandHeader: {
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  brandHeaderText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  brandHeaderBadge: { fontSize: 11, fontWeight: '800', color: COLORS.yellow },
  body: { padding: 18 },
  ticketRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 18,
  },
  ticketLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.gray400,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  ticketNum: { fontSize: 72, fontWeight: '900', color: COLORS.red, lineHeight: 72, letterSpacing: -3 },
  ticketRight: { alignItems: 'flex-end' },
  servingLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.gray400,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  servingNum: { fontSize: 36, fontWeight: '800', color: COLORS.gray700, letterSpacing: -1 },
  progressTrack: {
    backgroundColor: COLORS.gray100, borderRadius: 20, height: 12,
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 20 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  progressText: { fontSize: 12, color: COLORS.gray500 },
  turnAlert: {
    backgroundColor: COLORS.greenLight, borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  turnAlertText: { fontSize: 14, fontWeight: '700', color: COLORS.green, textAlign: 'center' },
  address: { fontSize: 12, color: COLORS.gray400, marginBottom: 16 },
  actions: { flexDirection: 'row' },
  refreshBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.red, borderRadius: 10,
    padding: 11, alignItems: 'center', marginRight: 10,
  },
  refreshBtnText: { color: COLORS.red, fontWeight: '700', fontSize: 13 },
  leaveBtn: {
    flex: 1, backgroundColor: '#FEF2F2', borderRadius: 10,
    padding: 11, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  leaveBtnText: { color: '#991B1B', fontWeight: '700', fontSize: 13 },
});
