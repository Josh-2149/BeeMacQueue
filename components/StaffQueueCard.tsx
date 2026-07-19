import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';
import { QueueEntry } from '../types';
import { PhosphorIcon } from './PhosphorIcon';

interface StaffQueueCardProps {
  entry: QueueEntry;
  queueIcon?: string;
  onServe?: () => void;
  onCall?: () => void;
  onCancel?: () => void;
  onMarkServed?: () => void;
  showActions?: boolean;
}

export function StaffQueueCard({
  entry,
  queueIcon = 'Queue',
  onServe,
  onCall,
  onCancel,
  onMarkServed,
  showActions = true,
}: StaffQueueCardProps) {
  const statusColors = {
    waiting: { bg: COLORS.blueLight, text: COLORS.blue, label: 'Waiting', icon: 'Clock' },
    called: { bg: '#FFF3CD', text: '#856404', label: 'Called', icon: 'Bell' },
    serving: { bg: COLORS.orangeLight, text: COLORS.orange, label: 'Serving', icon: 'UserCircle' },
    completed: { bg: COLORS.greenLight, text: COLORS.green, label: 'Completed', icon: 'CheckCircle' },
    cancelled: { bg: COLORS.gray100, text: COLORS.gray500, label: 'Cancelled', icon: 'X' },
    no_show: { bg: COLORS.gray100, text: COLORS.gray500, label: 'No Show', icon: 'Warning' },
  };

  const status = statusColors[entry.status] || statusColors.waiting;
  const userName = (entry.user as any)?.name || 'Customer';
  const userEmail = (entry.user as any)?.email || '';

  const isWaiting = entry.status === 'waiting';
  const isServing = entry.status === 'serving';
  const isCompleted = entry.status === 'completed';
  const isCalled = entry.status === 'called';
  const isQueueMarker = entry.ticket_number === 0;

  let queueMetadata: any = {};
  let creatorName: string = 'Unknown Staff';
  let creatorId: string = 'unknown';
  
  if (isQueueMarker && entry.notes) {
    try {
      queueMetadata = JSON.parse(entry.notes);
      creatorName = queueMetadata.created_by_name || (entry.user as any)?.name || 'Unknown Staff';
      creatorId = queueMetadata.created_by || entry.user_id || 'unknown';
    } catch {
      creatorName = (entry.user as any)?.name || 'Unknown Staff';
      creatorId = entry.user_id || 'unknown';
    }
  }

  const getIconColor = () => {
    const name = queueMetadata.name || '';
    if (name.toLowerCase().includes('vip')) return '#D97706';
    if (name.toLowerCase().includes('express')) return '#EA580C';
    if (name.toLowerCase().includes('regular')) return '#2563EB';
    if (name.toLowerCase().includes('priority')) return '#DC2626';
    return '#6B7280';
  };

  return (
    <View style={[styles.card, isServing && styles.cardServing, isQueueMarker && styles.queueMarker]}>
      <View style={styles.header}>
        <View style={styles.ticketInfo}>
          {isQueueMarker ? (
            <View style={[styles.queueIconContainer, { backgroundColor: getIconColor() + '20' }]}>
              <PhosphorIcon icon={queueIcon as any} size={16} color={getIconColor()} weight="bold" />
            </View>
          ) : (
            <Text style={styles.ticketNumber}>#{entry.ticket_number}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>
              {isQueueMarker ? (queueMetadata.name || 'Queue') : status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.timeText}>
          {new Date(entry.created_at).toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.customerInfo}>
        <View style={styles.customerAvatar}>
          <Text style={styles.avatarText}>
            {isQueueMarker ? 'Q' : userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>
            {isQueueMarker ? (queueMetadata.name || 'Queue') : userName}
          </Text>
          {!isQueueMarker && (
            <Text style={styles.customerEmail}>{userEmail}</Text>
          )}
          {!isQueueMarker && entry.party_size && entry.party_size > 1 && (
            <View style={styles.partySizeRow}>
              <PhosphorIcon icon="Users" size={10} color={COLORS.gray400} weight="bold" />
              <Text style={styles.partySize}> {entry.party_size}</Text>
            </View>
          )}
          {isQueueMarker && queueMetadata && (
            <View style={styles.queueMetaRow}>
              <PhosphorIcon icon="Clock" size={10} color={COLORS.gray400} weight="bold" />
              <Text style={styles.queueMeta}> {queueMetadata.estimatedWait || 15}min</Text>
              <PhosphorIcon icon="Users" size={10} color={COLORS.gray400} weight="bold" />
              <Text style={styles.queueMeta}> {queueMetadata.capacity || 50}</Text>
            </View>
          )}
          {/* ✅ Creator info for queue templates */}
          {isQueueMarker && (
            <View style={styles.creatorRow}>
              <PhosphorIcon icon="User" size={10} color={COLORS.gray400} weight="bold" />
              <Text style={styles.creatorText}> Created by {creatorName}</Text>
            </View>
          )}
        </View>
      </View>

      {!isQueueMarker && showActions && isWaiting && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={onCall}>
            <PhosphorIcon icon="Bell" size={14} color={COLORS.blue} weight="bold" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.serveBtn]} onPress={onServe}>
            <PhosphorIcon icon="ArrowRight" size={14} color={COLORS.white} weight="bold" />
            <Text style={styles.serveBtnText}>Serve</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
            <PhosphorIcon icon="X" size={14} color={COLORS.red} weight="bold" />
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isQueueMarker && showActions && isCalled && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.serveBtn]} onPress={onServe}>
            <PhosphorIcon icon="ArrowRight" size={14} color={COLORS.white} weight="bold" />
            <Text style={styles.serveBtnText}>Start Serving</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={onCall}>
            <PhosphorIcon icon="Bell" size={14} color={COLORS.blue} weight="bold" />
            <Text style={styles.callBtnText}>Call Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isQueueMarker && showActions && isServing && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.servedActionBtn]} 
            onPress={onMarkServed}
          >
            <PhosphorIcon icon="CheckCircle" size={14} color={COLORS.white} weight="fill" />
            <Text style={styles.servedActionText}>Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.callBtn]} 
            onPress={onCall}
          >
            <PhosphorIcon icon="Bell" size={14} color={COLORS.blue} weight="bold" />
            <Text style={styles.callBtnText}>Call Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isQueueMarker && showActions && isCompleted && (
        <View style={styles.servedFooter}>
          <PhosphorIcon icon="CheckCircle" size={12} color={COLORS.green} weight="fill" />
          <Text style={styles.servedFooterText}>
            Completed at {new Date(entry.served_at || entry.updated_at || entry.created_at).toLocaleTimeString('en-PH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 0.5,
  },
  queueMarker: {
    borderColor: COLORS.blueBorder,
    backgroundColor: COLORS.blueLight,
  },
  cardServing: {
    borderColor: COLORS.orange,
    borderWidth: 2,
    backgroundColor: COLORS.orangeLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.red,
    letterSpacing: -0.5,
  },
  queueIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 10,
    color: COLORS.gray400,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.red,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  customerEmail: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: 1,
  },
  partySizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  partySize: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  queueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    gap: 2,
  },
  queueMeta: {
    fontSize: 10,
    color: COLORS.gray500,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  creatorText: {
    fontSize: 9,
    color: COLORS.gray400,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  callBtn: {
    backgroundColor: COLORS.blueLight,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
  },
  callBtnText: {
    color: COLORS.blue,
    fontWeight: '700',
    fontSize: 10,
  },
  serveBtn: {
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  serveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 10,
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    color: COLORS.red,
    fontWeight: '700',
    fontSize: 10,
  },
  servedActionBtn: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  servedActionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 10,
  },
  servedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  servedFooterText: {
    fontSize: 10,
    color: COLORS.gray500,
    fontWeight: '500',
  },
});