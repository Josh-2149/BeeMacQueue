import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { EmptyState } from '../../components/ui';
import { SafeScreen } from '../../components/SafeScreen';
import { COLORS } from '../../lib/constants';
import { AppNotification } from '../../types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const {
    notifications, unreadCount, loading,
    markAllRead, markOneRead,
  } = useNotifications(user?.id);

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

  function typeIcon(type: AppNotification['type']) {
    if (type === 'serve') return '✅';
    if (type === 'queue') return '🎫';
    return 'ℹ️';
  }

  return (
    <SafeScreen style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markBtn} onPress={markAllRead}>
            <Text style={styles.markBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.red} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" sub="You're all caught up!" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifItem, !n.is_read && styles.notifUnread]}
              onPress={() => !n.is_read && markOneRead(n.id)}
              activeOpacity={0.8}
            >
              <View style={styles.notifIconBox}>
                <Text style={styles.notifIconText}>{typeIcon(n.type)}</Text>
                {!n.is_read && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifMsg}>{n.message}</Text>
                <Text style={styles.notifTime}>{formatTime(n.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.red, paddingTop: 56, paddingHorizontal: 20,
    paddingBottom: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  markBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  markBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  notifItem: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.red },
  notifIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.gray100, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, marginRight: 12,
  },
  notifIconText: { fontSize: 20 },
  unreadDot: {
    position: 'absolute', top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.red, borderWidth: 2, borderColor: COLORS.white,
  },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray900, marginBottom: 3 },
  notifMsg: { fontSize: 13, color: COLORS.gray500, lineHeight: 19 },
  notifTime: { fontSize: 11, color: COLORS.gray400, marginTop: 5 },
});
