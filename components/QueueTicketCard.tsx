import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { QueueEntry } from '../types';
import { COLORS, BRAND } from '../lib/constants';
import { PhosphorIcon } from './PhosphorIcon';

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
    Alert.alert(
      'Leave Queue?',
      "You'll lose your spot and can't get it back.",
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onLeave },
      ]
    );
  }

  return (
    <View style={[styles.card, isNext && styles.cardActive]}>
      {/* Brand Header */}
      <View style={[styles.brandHeader, { backgroundColor: brand?.color ?? COLORS.red }]}>
        <View style={styles.brandHeaderLeft}>
          <PhosphorIcon icon="Storefront" size={16} color={COLORS.white} weight="bold" />
          <Text style={styles.brandHeaderText}>
            {est?.name} · {est?.branch}
          </Text>
        </View>
        {isNext && (
          <View style={styles.yourTurnBadge}>
            <PhosphorIcon icon="ArrowRight" size={12} color={COLORS.yellow} weight="bold" />
            <Text style={styles.yourTurnText}>YOUR TURN</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Ticket Numbers */}
        <View style={styles.ticketRow}>
          <View style={styles.ticketBlock}>
            <Text style={styles.ticketLabel}>YOUR TICKET</Text>
            <View style={styles.ticketNumRow}>
              <Text style={styles.ticketHash}>#</Text>
              <Text style={styles.ticketNum}>{ticket}</Text>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.ticketBlock}>
            <Text style={styles.servingLabel}>NOW SERVING</Text>
            <View style={styles.ticketNumRow}>
              <Text style={styles.servingHash}>#</Text>
              <Text style={styles.servingNum}>{serving}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            {
              width: `${progress}%` as any,
              backgroundColor: isNext ? COLORS.green : COLORS.red,
            },
          ]} />
        </View>

        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <View style={styles.progressInfoItem}>
            <PhosphorIcon icon="Users" size={14} color={COLORS.gray500} weight="bold" />
            <Text style={styles.progressText}>{ahead} ahead</Text>
          </View>
          <View style={styles.progressInfoItem}>
            <PhosphorIcon icon="Clock" size={14} color={isNext ? COLORS.green : COLORS.red} weight="bold" />
            <Text style={[
              styles.progressTextBold,
              { color: isNext ? COLORS.green : COLORS.red },
            ]}>
              {isNext ? 'Head to counter!' : `~${estWait} min${estWait !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Next Alert */}
        {isNext && (
          <View style={styles.turnAlert}>
            <PhosphorIcon icon="CheckCircle" size={16} color={COLORS.green} weight="fill" />
            <Text style={styles.turnAlertText}>
              Please proceed to the counter now
            </Text>
          </View>
        )}

        {/* Location */}
        <View style={styles.locationRow}>
          <PhosphorIcon icon="MapPin" size={14} color={COLORS.gray400} weight="bold" />
          <Text style={styles.address}>{est?.address}</Text>
        </View>

        {/* Queue Name */}
        {queue.queue && (
          <View style={styles.queueNameRow}>
            <PhosphorIcon icon="Queue" size={14} color={COLORS.gray400} weight="bold" />
            <Text style={styles.queueNameText}>{queue.queue.name}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <PhosphorIcon icon="ArrowsClockwise" size={16} color={COLORS.red} weight="bold" />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveBtn} onPress={confirmLeave} activeOpacity={0.7}>
            <PhosphorIcon icon="SignOut" size={16} color="#991B1B" weight="bold" />
            <Text style={styles.leaveBtnText}>Leave Queue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.red,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  cardActive: {
    borderColor: COLORS.green,
    shadowColor: COLORS.green,
  },
  brandHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  yourTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  yourTurnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.yellow,
  },
  body: {
    padding: 16,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketBlock: {
    flex: 1,
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray400,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ticketNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ticketHash: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.red,
    marginRight: 2,
  },
  ticketNum: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.red,
    letterSpacing: -2,
    lineHeight: 56,
  },
  ticketDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.gray200,
    marginHorizontal: 8,
  },
  servingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray400,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  servingHash: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray600,
    marginRight: 1,
  },
  servingNum: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.gray700,
    letterSpacing: -1,
  },
  progressTrack: {
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    height: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  progressTextBold: {
    fontSize: 12,
    fontWeight: '700',
  },
  turnAlert: {
    backgroundColor: COLORS.greenLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnAlertText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.green,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  address: {
    fontSize: 12,
    color: COLORS.gray400,
    flex: 1,
  },
  queueNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  queueNameText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.red,
    borderRadius: 10,
    padding: 11,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  refreshBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: 13,
  },
  leaveBtn: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 11,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  leaveBtnText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 13,
  },
});