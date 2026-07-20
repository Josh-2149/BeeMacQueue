import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';
import { PhosphorIcon } from './PhosphorIcon';
import { QueueEntry } from '../types';

interface StaffQueueCardProps {
  entry: QueueEntry;
  queueName?: string;
  queueIcon?: string;
  createdByName?: string;
  onServe: () => void;
  onCall: () => void;
  onCancel: () => void;
  onMarkServed: () => void;
  showActions?: boolean;
}

export function StaffQueueCard({
  entry,
  queueName,
  queueIcon,
  createdByName,
  onServe,
  onCall,
  onCancel,
  onMarkServed,
  showActions = true,
}: StaffQueueCardProps) {
  const getStatusColor = () => {
    switch (entry.status) {
      case 'waiting': return COLORS.blue;
      case 'serving': return COLORS.orange;
      case 'completed': return COLORS.green;
      case 'cancelled': return COLORS.red;
      default: return COLORS.gray500;
    }
  };

  const getStatusLabel = () => {
    switch (entry.status) {
      case 'waiting': return 'Waiting';
      case 'serving': return 'Serving';
      case 'completed': return 'Served';
      case 'cancelled': return 'Cancelled';
      default: return entry.status;
    }
  };

  const getStatusIcon = () => {
    switch (entry.status) {
      case 'waiting': return 'Clock';
      case 'serving': return 'UserCircle';
      case 'completed': return 'CheckCircle';
      case 'cancelled': return 'XCircle';
      default: return 'Circle';
    }
  };

  const displayIcon = queueIcon || getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <View style={[styles.card, entry.status === 'serving' && styles.cardActive]}>
      {/* Top Row: Icon + Ticket + Status */}
      <View style={styles.header}>
        <View style={styles.ticketInfo}>
          <View style={[styles.ticketIconContainer, { backgroundColor: statusColor + '15' }]}>
            <PhosphorIcon icon={displayIcon} size={18} color={statusColor} weight="bold" />
          </View>
          <View>
            <Text style={styles.ticketNumber}>#{entry.ticket_number}</Text>
            {queueName && (
              <View style={styles.queueNameRow}>
                <PhosphorIcon icon="Queue" size={10} color={COLORS.gray400} weight="bold" />
                <Text style={styles.queueName}>{queueName}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {/* Body: Customer Name + Time */}
      <View style={styles.body}>
        <View style={styles.customerInfo}>
          <PhosphorIcon icon="User" size={13} color={COLORS.gray400} weight="bold" />
          <Text style={styles.customerName}>
            {entry.user?.name || 'Customer'}
          </Text>
        </View>
        <View style={styles.timeRow}>
          <PhosphorIcon icon="Calendar" size={11} color={COLORS.gray300} weight="bold" />
          <Text style={styles.ticketTime}>
            {new Date(entry.created_at).toLocaleString('en-PH', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>

      {/* Party size / table info */}
      {(entry.party_size || entry.table_number) && (
        <View style={styles.metaRow}>
          {entry.party_size && entry.party_size > 1 && (
            <View style={styles.metaBadge}>
              <PhosphorIcon icon="Users" size={10} color={COLORS.gray500} weight="bold" />
              <Text style={styles.metaText}>{entry.party_size} pax</Text>
            </View>
          )}
          {entry.table_number && (
            <View style={styles.metaBadge}>
              <PhosphorIcon icon="MapPin" size={10} color={COLORS.gray500} weight="bold" />
              <Text style={styles.metaText}>Table {entry.table_number}</Text>
            </View>
          )}
        </View>
      )}

      {/* Created by attribution */}
      <View style={styles.attributionRow}>
        <PhosphorIcon icon="UserCircle" size={12} color={COLORS.gray400} weight="bold" />
        <Text style={styles.attributionText}>Created by: {createdByName || 'Unknown'}</Text>
      </View>

      {/* Actions */}
      {showActions && entry.status === 'waiting' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={onCall} activeOpacity={0.7}>
            <PhosphorIcon icon="Phone" size={16} color={COLORS.blue} weight="bold" />
            <Text style={[styles.actionBtnText, { color: COLORS.blue }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.serveBtn]} onPress={onServe} activeOpacity={0.7}>
            <PhosphorIcon icon="ArrowRight" size={16} color={COLORS.white} weight="bold" />
            <Text style={[styles.actionBtnText, styles.serveBtnText]}>Serve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.7}>
            <PhosphorIcon icon="X" size={16} color={COLORS.red} weight="bold" />
            <Text style={[styles.actionBtnText, { color: COLORS.red }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {showActions && entry.status === 'serving' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={onMarkServed} activeOpacity={0.7}>
            <PhosphorIcon icon="Check" size={16} color={COLORS.white} weight="bold" />
            <Text style={[styles.actionBtnText, styles.completeBtnText]}>Mark Served</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
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
  cardActive: {
    borderColor: COLORS.orange + '40',
    backgroundColor: '#FFFBF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ticketIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  queueNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  queueName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketTime: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    paddingTop: 4,
  },
  attributionText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 5,
    flex: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  callBtn: {
    backgroundColor: COLORS.blueLight,
    borderWidth: 1,
    borderColor: COLORS.blue + '30',
  },
  serveBtn: {
    backgroundColor: COLORS.green,
  },
  serveBtnText: {
    color: COLORS.white,
  },
  cancelBtn: {
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: COLORS.red + '30',
  },
  completeBtn: {
    backgroundColor: COLORS.green,
    flex: 1,
  },
  completeBtnText: {
    color: COLORS.white,
  },
});