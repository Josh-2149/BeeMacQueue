import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useConfirm } from '../context/ConfirmContext';
import { QueueEntry } from '../types';
import { COLORS, BRAND } from '../lib/constants';
import { PhosphorIcon } from './PhosphorIcon';

interface Props {
  queue: QueueEntry;
  onLeave: () => void;
  onRefresh: () => void;
  peopleAhead: number;
  isYourTurn: boolean;
  estimatedWaitMins: number;
}

export function QueueTicketCard({ queue, onLeave, onRefresh, peopleAhead, isYourTurn, estimatedWaitMins }: Props) {
  const { showConfirm } = useConfirm();
  const est = queue.establishment;
  const brand = est?.brand ? BRAND[est.brand] : null;
  const ticket = queue.ticket_number;

  // ✅ FIXED: Progress based on actual people ahead + your position
  const totalAhead = peopleAhead + 1; // you + people ahead
  const progress = totalAhead > 0 
    ? Math.min(97, Math.max(5, ((totalAhead - peopleAhead) / Math.max(totalAhead, 1)) * 100))
    : 50;

  async function confirmLeave() {
    const choice = await showConfirm({
      title: 'Leave Queue?',
      message: "You'll lose your spot and can't get it back.",
      options: [
        { label: 'Stay', style: 'cancel' },
        { label: 'Leave', style: 'destructive' },
      ],
    });

    if (choice === 'Leave') onLeave();
  }

  return (
    <View style={[styles.card, isYourTurn && styles.cardActive]}>
      {/* Brand Header */}
      <View style={[styles.brandHeader, { backgroundColor: brand?.color ?? COLORS.red }]}>
        <View style={styles.brandHeaderLeft}>
          <PhosphorIcon icon="Storefront" size={16} color={COLORS.white} weight="bold" />
          <Text style={styles.brandHeaderText}>
            {est?.name} · {est?.branch}
          </Text>
        </View>
        {isYourTurn && (
          <View style={styles.yourTurnBadge}>
            <PhosphorIcon icon="ArrowRight" size={12} color={COLORS.yellow} weight="bold" />
            <Text style={styles.yourTurnText}>YOUR TURN</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Ticket Number + Status */}
        <View style={styles.ticketRow}>
          <View style={styles.ticketBlock}>
            <Text style={styles.ticketLabel}>YOUR TICKET</Text>
            <View style={styles.ticketNumRow}>
              <Text style={styles.ticketHash}>#</Text>
              <Text style={[styles.ticketNum, isYourTurn && { color: COLORS.green }]}>
                {ticket}
              </Text>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.ticketBlock}>
            <Text style={styles.servingLabel}>STATUS</Text>
            <View style={styles.statusBadge}>
              <PhosphorIcon 
                icon={isYourTurn ? 'CheckCircle' : 'Clock'} 
                size={18} 
                color={isYourTurn ? COLORS.green : COLORS.red} 
                weight="fill" 
              />
              <Text style={[styles.statusText, { color: isYourTurn ? COLORS.green : COLORS.red }]}>
                {isYourTurn ? 'SERVING' : 'WAITING'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            {
              width: `${progress}%` as any,
              backgroundColor: isYourTurn ? COLORS.green : COLORS.red,
            },
          ]} />
        </View>

        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <View style={styles.progressInfoItem}>
            <PhosphorIcon icon="Users" size={14} color={COLORS.gray500} weight="bold" />
            <Text style={styles.progressText}>
              {peopleAhead === 0 ? 'No one ahead' : `${peopleAhead} ahead`}
            </Text>
          </View>
          <View style={styles.progressInfoItem}>
            <PhosphorIcon icon="Clock" size={14} color={isYourTurn ? COLORS.green : COLORS.red} weight="bold" />
            <Text style={[
              styles.progressTextBold,
              { color: isYourTurn ? COLORS.green : COLORS.red },
            ]}>
              {isYourTurn ? 'Head to counter!' : `~${estimatedWaitMins} min${estimatedWaitMins !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Turn Alert */}
        {isYourTurn && (
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.5,
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