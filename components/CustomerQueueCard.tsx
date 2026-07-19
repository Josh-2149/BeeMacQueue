import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, BRAND } from '../lib/constants';
import { PhosphorIcon } from './PhosphorIcon';
import { Queue } from '../types';

interface CustomerQueueCardProps {
  queue: Queue & { isFull?: boolean; servingCount?: number };
  onJoin: () => void;
  isUserQueue?: boolean;
  isServedToday?: boolean;
  isJoining?: boolean;
  hasActiveElsewhere?: boolean;
}

export function CustomerQueueCard({ 
  queue, 
  onJoin, 
  isUserQueue, 
  isServedToday,
  isJoining,
  hasActiveElsewhere,
}: CustomerQueueCardProps) {
  const getQueueIcon = (): string => {
    const name = (queue.name || '').toLowerCase();
    if (name.includes('vip')) return 'Crown';
    if (name.includes('express')) return 'Rocket';
    if (name.includes('priority')) return 'Star';
    if (name.includes('regular')) return 'Clock';
    return 'Queue';
  };

  const brand = queue.establishment?.brand || 'jollibee';
  const brandInfo = BRAND[brand];
  const waitingCount = queue.waitingCount || 0;
  const isFull = (queue as any).isFull || false;
  const capacity = queue.capacity || 50;
  const totalActive = waitingCount + ((queue as any).servingCount || 0);

  const getButtonConfig = () => {
    if (isUserQueue) {
      return {
        text: '✓ Your Queue',
        bgColor: COLORS.green,
        icon: 'CheckCircle' as string,
        disabled: true,
        showCapacity: false,
      };
    }
    if (isServedToday) {
      return {
        text: '✓ Served Today',
        bgColor: COLORS.blue,
        icon: 'CheckCircle' as string,
        disabled: true,
        showCapacity: false,
      };
    }
    // 🆕 QUEUE FULL STATE
    if (isFull) {
      return {
        text: 'Queue Full',
        bgColor: COLORS.orange,
        icon: 'WarningCircle' as string,
        disabled: true,
        showCapacity: true,
      };
    }
    if (isJoining) {
      return {
        text: 'Joining...',
        bgColor: COLORS.gray400,
        icon: null,
        disabled: true,
        showLoader: true,
        showCapacity: false,
      };
    }
    if (hasActiveElsewhere) {
      return {
        text: 'In Another Queue',
        bgColor: COLORS.gray400,
        icon: 'WarningCircle' as string,
        disabled: true,
        showCapacity: false,
      };
    }
    return {
      text: 'Join Queue',
      bgColor: COLORS.red,
      icon: 'ArrowRight',
      disabled: false,
      showCapacity: false,
    };
  };

  const buttonConfig = getButtonConfig();

  const getAccentColor = () => {
    if (isUserQueue) return COLORS.green;
    if (isServedToday) return COLORS.blue;
    if (isFull) return COLORS.orange;
    return brandInfo.color;
  };

  const accentColor = getAccentColor();

  return (
    <View style={[
      styles.card,
      isUserQueue && styles.cardUserQueue,
      isServedToday && styles.cardServedToday,
      isFull && !isUserQueue && !isServedToday && styles.cardFull,
    ]}>
      <View style={styles.topRow}>
        <View style={[
          styles.queueIconContainer,
          { backgroundColor: isUserQueue ? COLORS.greenLight : isServedToday ? COLORS.blueLight : isFull ? COLORS.orangeLight : COLORS.gray50 }
        ]}>
          <PhosphorIcon 
            icon={getQueueIcon()} 
            size={20} 
            color={accentColor} 
            weight="bold" 
          />
        </View>

        <View style={styles.queueInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.queueName} numberOfLines={1}>
              {queue.name || 'Queue'}
            </Text>
            {isUserQueue && (
              <View style={styles.yourBadge}>
                <Text style={styles.yourBadgeText}>YOU</Text>
              </View>
            )}
            {isFull && !isUserQueue && (
              <View style={styles.fullBadge}>
                <Text style={styles.fullBadgeText}>FULL</Text>
              </View>
            )}
          </View>
          <View style={styles.waitTimeRow}>
            <PhosphorIcon icon="Clock" size={12} color={COLORS.gray500} weight="bold" />
            <Text style={styles.waitTime}>
              ~{queue.estimated_wait_mins || 15} min wait
            </Text>
          </View>
          <View style={styles.locationRow}>
            <PhosphorIcon icon="MapPin" size={12} color={COLORS.gray400} weight="bold" />
            <Text style={styles.locationText} numberOfLines={1}>
              {queue.establishment?.name || 'Branch'} - {queue.establishment?.branch || ''}
            </Text>
          </View>
        </View>

        <View style={[
          styles.waitingBadge,
          isUserQueue && { backgroundColor: COLORS.greenLight },
          isServedToday && { backgroundColor: COLORS.blueLight },
          isFull && { backgroundColor: COLORS.orangeLight },
        ]}>
          <PhosphorIcon 
            icon="Users" 
            size={14} 
            color={isUserQueue ? COLORS.green : isServedToday ? COLORS.blue : isFull ? COLORS.orange : COLORS.gray600} 
            weight="bold" 
          />
          <Text style={[
            styles.waitingCount,
            isUserQueue && { color: COLORS.green },
            isServedToday && { color: COLORS.blue },
            isFull && { color: COLORS.orange },
          ]}>
            {totalActive}
          </Text>
          {/* 🆕 Show capacity */}
          <Text style={styles.capacityLabel}>/{capacity}</Text>
        </View>
      </View>

      {isServedToday && (
        <View style={styles.servedMessage}>
          <PhosphorIcon icon="Info" size={12} color={COLORS.blue} weight="bold" />
          <Text style={styles.servedMessageText}>
            You've been served here today. Come back tomorrow!
          </Text>
        </View>
      )}

      {isFull && !isUserQueue && !isServedToday && (
        <View style={styles.fullMessage}>
          <PhosphorIcon icon="WarningCircle" size={12} color={COLORS.orange} weight="fill" />
          <Text style={styles.fullMessageText}>
            Queue is full ({totalActive}/{capacity}). Wait for someone to leave.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.joinButton,
          { backgroundColor: buttonConfig.bgColor },
          buttonConfig.disabled && styles.joinButtonDisabled,
        ]}
        onPress={onJoin}
        disabled={buttonConfig.disabled}
        activeOpacity={0.8}
      >
        {buttonConfig.showLoader ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <>
            <Text style={styles.joinButtonText}>{buttonConfig.text}</Text>
            {buttonConfig.icon && (
              <PhosphorIcon 
                icon={buttonConfig.icon} 
                size={16} 
                color={COLORS.white} 
                weight="bold" 
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardUserQueue: {
    borderColor: COLORS.green,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  cardServedToday: {
    borderColor: COLORS.blueBorder,
    borderWidth: 1,
    backgroundColor: '#F8FAFF',
  },
  cardFull: {
    borderColor: COLORS.orange,
    borderWidth: 1,
    backgroundColor: '#FFFBF5',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  queueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  queueInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  queueName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray900,
    flexShrink: 1,
  },
  yourBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yourBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.white,
  },
  fullBadge: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.white,
  },
  waitTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  waitTime: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.gray400,
    flexShrink: 1,
  },
  waitingBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 50,
  },
  waitingCount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    marginTop: 1,
  },
  capacityLabel: {
    fontSize: 9,
    color: COLORS.gray400,
    fontWeight: '600',
    marginTop: -1,
  },
  servedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.blueLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  servedMessageText: {
    fontSize: 11,
    color: COLORS.blue,
    fontWeight: '500',
    flex: 1,
  },
  fullMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.orangeLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  fullMessageText: {
    fontSize: 11,
    color: COLORS.orange,
    fontWeight: '500',
    flex: 1,
  },
  joinButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  joinButtonDisabled: {
    opacity: 0.85,
  },
  joinButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});