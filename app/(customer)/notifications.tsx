import React from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useNotification } from '../../context/NotificationContext';
import { SafeScreen } from '../../components/SafeScreen';
import { COLORS } from '../../lib/constants';
import { AppNotification } from '../../types';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('👤 [Customer Notifications] Screen mounted');

export default function CustomerNotificationsScreen() {
  console.log('👤 [Customer Notifications] Rendering');
  const { notifications, unreadCount, loading, markAllRead, markOneRead, fetchNotifications } = useNotification();
  const [refreshing, setRefreshing] = React.useState(false);

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

  function getIcon(type: AppNotification['type'], title: string) {
    if (title.includes('New Queue') || title.includes('Queue Created')) {
      return { icon: 'PlusCircle', color: COLORS.blue };
    }
    if (title.includes('Joined')) {
      return { icon: 'UserPlus', color: COLORS.green };
    }
    if (title.includes('Your turn') || title.includes('Customer Call')) {
      return { icon: 'Bell', color: COLORS.orange };
    }
    if (title.includes('Service Complete') || title.includes('served')) {
      return { icon: 'CheckCircle', color: COLORS.green };
    }
    if (title.includes('Cancelled') || title.includes('cancelled')) {
      return { icon: 'XCircle', color: COLORS.red };
    }
    return { icon: 'Info', color: COLORS.gray400 };
  }

  if (loading) {
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <PhosphorIcon icon="Bell" size={24} color={COLORS.white} weight="bold" />
          <Text style={styles.headerTitle}>BeeMacQueue</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <Text style={styles.headerSub}>
            {notifications.length} notifications
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
              <PhosphorIcon icon="CheckCircle" size={14} color={COLORS.white} weight="bold" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <PhosphorIcon icon="Bell" size={56} color={COLORS.gray300} weight="duotone" />
          <Text style={styles.emptyTitle}>All caught up! 🎉</Text>
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
            const iconData = getIcon(n.type, n.title);
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.notifItem, !n.is_read && styles.notifUnread]}
                onPress={() => !n.is_read && markOneRead(n.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.notifIcon, { backgroundColor: `${iconData.color}15` }]}>
                  <PhosphorIcon icon={iconData.icon as any} size={20} color={iconData.color} weight="bold" />
                  {!n.is_read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notifBody}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                    <Text style={styles.notifTime}>{formatTime(n.created_at)}</Text>
                  </View>
                  <Text style={styles.notifMsg} numberOfLines={2}>{n.message}</Text>
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: COLORS.red,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  unreadBadge: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.redDark,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 36 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray600,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.gray400,
  },
  notifItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notifUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  notifIcon: {
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
  notifBody: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
    flex: 1,
    marginRight: 8,
  },
  notifMsg: {
    fontSize: 13,
    color: COLORS.gray500,
    lineHeight: 19,
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.gray400,
  },
});