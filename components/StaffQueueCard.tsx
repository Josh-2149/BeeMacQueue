import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { QueueEntry } from '../types';

interface StaffQueueCardProps {
  entry: QueueEntry;
  queueName?: string;
  queueIcon?: string;
  onServe: () => void;
  onCall: () => void;
  onCancel: () => void;
  onMarkServed: () => void;
  showActions?: boolean;
}

export function StaffQueueCard({
  entry,
  queueName,
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
      default: return COLORS.gray500;
    }
  };

  const getStatusLabel = () => {
    switch (entry.status) {
      case 'waiting': return 'Waiting';
      case 'serving': return 'Serving';
      case 'completed': return 'Served';
      default: return entry.status;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketNumber}>#{entry.ticket_number}</Text>
          {queueName && (
            <Text style={styles.queueName}>{queueName}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.customerName}>
          {entry.user?.name || 'Customer'}
        </Text>
        <Text style={styles.ticketTime}>
          {new Date(entry.created_at).toLocaleString()}
        </Text>
      </View>

      {showActions && entry.status === 'waiting' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={onCall}>
            <Ionicons name="call-outline" size={18} color={COLORS.blue} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.serveBtn]} onPress={onServe}>
            <Ionicons name="arrow-forward-outline" size={18} color={COLORS.white} />
            <Text style={[styles.actionBtnText, styles.serveBtnText]}>Serve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
            <Ionicons name="close-outline" size={18} color={COLORS.red} />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {showActions && entry.status === 'serving' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={onMarkServed}>
            <Ionicons name="checkmark-outline" size={18} color={COLORS.white} />
            <Text style={[styles.actionBtnText, styles.completeBtnText]}>Complete</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 8,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  queueName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  ticketTime: {
    fontSize: 11,
    color: COLORS.gray400,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  callBtn: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blueLight,
  },
  serveBtn: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  serveBtnText: {
    color: COLORS.white,
  },
  cancelBtn: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.redLight,
  },
  completeBtn: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
    flex: 1,
  },
  completeBtnText: {
    color: COLORS.white,
  },
});