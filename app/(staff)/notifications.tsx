import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { COLORS } from '../../lib/constants';
import { AppNotification } from '../../types';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('🏪 [Staff Notifications] Screen mounted');

export default function StaffNotificationsScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    fetchNotifications,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }

  function stripEmoji(text: string) {
    return text.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    ).trim();
  }

  function getOperationIcon(title: string, message: string) {
    const text = (title + ' ' + message).toLowerCase();
    if (text.includes('deleted') || text.includes('removed') || text.includes('delete')) {
      return { icon: 'Trash', color: '#DC2626' };
    }
    if (text.includes('updated') || text.includes('edit') || text.includes('changed')) {
      return { icon: 'Pencil', color: '#2563EB' };
    }
    if (text.includes('created') || text.includes('new queue')) {
      return { icon: 'Plus', color: '#16A34A' };
    }
    if (text.includes('served') || text.includes('complete') || text.includes('served')) {
      return { icon: 'CheckCircle', color: '#16A34A' };
    }
    if (text.includes('called') || text.includes('your turn')) {
      return { icon: 'Bell', color: '#F59E0B' };
    }
    if (text.includes('cancelled') || text.includes('cancel')) {
      return { icon: 'XCircle', color: '#DC2626' };
    }
    return { icon: 'Info', color: '#6B7280' };
  }

  const cleanTitle = (n: AppNotification) => stripEmoji(n.title);
  const cleanMessage = (n: AppNotification) => stripEmoji(n.message);

  if (!userId || loading) {
    return (
      <SafeScreen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader
        title="Alerts"
        subtitle={`${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.7}>
              <PhosphorIcon icon="CheckCircle" size={14} color={COLORS.white} weight="bold" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <PhosphorIcon icon="Bell" size={48} color={COLORS.gray300} weight="duotone" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySub}>No notifications to show</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />
          }
        >
          {notifications.map((n) => {
            const op = getOperationIcon(n.title, n.message);
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.notifItem, !n.is_read && styles.notifUnread]}
                onPress={() => !n.is_read && markOneRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${op.color}15` }]}>
                  <PhosphorIcon icon={op.icon as any} size={18} color={op.color} weight="bold" />
                  {!n.is_read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{cleanTitle(n)}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>{cleanMessage(n)}</Text>
                  <Text style={styles.notifTime}>{formatTime(n.created_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  markAllText: { fontSize: 11, color: COLORS.white, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray600, marginTop: 8 },
  emptySub: { fontSize: 14, color: COLORS.gray400 },
  notifItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notifUnread: {
    backgroundColor: '#FFF5F5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notifBody: { flex: 1, justifyContent: 'center' },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  notifMsg: {
    fontSize: 13,
    color: COLORS.gray500,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
    color: COLORS.gray400,
    fontWeight: '500',
  },
});