import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';
import { PhosphorIcon } from './PhosphorIcon';

interface StaffStatsCardProps {
  stats: {
    totalWaiting: number;
    totalServing: number;
    totalServed: number;
    todayServed: number;
  };
  onServeNext?: () => void;
  processing?: boolean;
}

export function StaffStatsCard({ stats, onServeNext, processing }: StaffStatsCardProps) {
  const hasWaiting = stats.totalWaiting > 0;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={[styles.statItem, styles.waitingStat]}>
          <PhosphorIcon icon="Clock" size={18} color="#DC2626" weight="bold" />
          <Text style={[styles.statNumber, styles.waitingNumber]}>{stats.totalWaiting}</Text>
          <Text style={[styles.statLabel, styles.waitingLabel]}>Waiting</Text>
        </View>

        <View style={[styles.statItem, styles.servingStat]}>
          <PhosphorIcon icon="UserCircle" size={18} color="#EA580C" weight="bold" />
          <Text style={[styles.statNumber, styles.servingNumber]}>{stats.totalServing}</Text>
          <Text style={[styles.statLabel, styles.servingLabel]}>Serving</Text>
        </View>

        <View style={[styles.statItem, styles.todayStat]}>
          <PhosphorIcon icon="CheckCircle" size={18} color="#16A34A" weight="fill" />
          <Text style={[styles.statNumber, styles.todayNumber]}>{stats.todayServed}</Text>
          <Text style={[styles.statLabel, styles.todayLabel]}>Today</Text>
        </View>

        <View style={[styles.statItem, styles.totalStat]}>
          <PhosphorIcon icon="ChartBar" size={18} color="#6B7280" weight="bold" />
          <Text style={[styles.statNumber, styles.totalNumber]}>{stats.totalServed}</Text>
          <Text style={[styles.statLabel, styles.totalLabel]}>Total</Text>
        </View>
      </View>

      {onServeNext && (
        <TouchableOpacity
          style={[
            styles.serveButton,
            !hasWaiting && styles.serveButtonDisabled,
            processing && styles.serveButtonProcessing,
          ]}
          onPress={onServeNext}
          disabled={!hasWaiting || processing}
          activeOpacity={0.7}
        >
          <PhosphorIcon 
            icon="ArrowRight" 
            size={16} 
            color={hasWaiting ? COLORS.white : COLORS.gray400} 
            weight="bold" 
          />
          <Text style={[styles.serveButtonText, !hasWaiting && styles.serveButtonTextDisabled]}>
            {processing ? 'Processing...' : hasWaiting ? 'Serve Next' : 'No Waiting'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 0,
  },
  waitingStat: {
    backgroundColor: '#FEF2F2',
  },
  servingStat: {
    backgroundColor: '#FFF7ED',
  },
  todayStat: {
    backgroundColor: '#F0FDF4',
  },
  totalStat: {
    backgroundColor: '#F3F4F6',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.gray900,
    marginTop: 1,
  },
  waitingNumber: {
    color: '#DC2626',
  },
  servingNumber: {
    color: '#EA580C',
  },
  todayNumber: {
    color: '#16A34A',
  },
  totalNumber: {
    color: '#6B7280',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  waitingLabel: {
    color: '#DC2626',
  },
  servingLabel: {
    color: '#EA580C',
  },
  todayLabel: {
    color: '#16A34A',
  },
  totalLabel: {
    color: '#6B7280',
  },
  serveButton: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  serveButtonDisabled: {
    backgroundColor: COLORS.gray100,
    shadowOpacity: 0,
    elevation: 0,
  },
  serveButtonProcessing: {
    opacity: 0.7,
  },
  serveButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  serveButtonTextDisabled: {
    color: COLORS.gray400,
  },
});