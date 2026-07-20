import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useRouter } from 'expo-router';
import { useNotification } from '../../context/NotificationContext';
import { SafeScreen } from '../../components/SafeScreen';
import { StaffHeader } from '../../components/StaffHeader';
import { SectionLabel } from '../../components/ui';
import { COLORS } from '../../lib/constants';
import { AppNotification } from '../../types';
import { PhosphorIcon } from '../../components/PhosphorIcon';

console.log('[Staff Notifications] Screen mounted');

// ── Notification Type Configuration ───────────────────────────────────────
type NotifCategory =
  | 'customer_joined'
  | 'customer_left'
  | 'customer_served'
  | 'customer_called'
  | 'customer_cancelled'
  | 'queue_created'
  | 'queue_deleted'
  | 'queue_updated'
  | 'new_queue'
  | 'info';

interface NotifConfig {
  icon: string;
  color: string;
  bg: string;
  label: string;
  weight: 'fill' | 'bold';
}

const NOTIF_CONFIG: Record<NotifCategory, NotifConfig> = {
  customer_joined:    { icon: 'User',          color: '#0891B2', bg: '#ECFEFF', label: 'Customer Joined',  weight: 'fill' },
  customer_left:      { icon: 'User',          color: '#6B7280', bg: '#F3F4F6', label: 'Customer Left',    weight: 'bold' },
  customer_served:    { icon: 'CheckCircle',   color: '#16A34A', bg: '#F0FDF4', label: 'Service Complete', weight: 'fill' },
  customer_called:    { icon: 'PhoneCall',     color: '#7C3AED', bg: '#F5F3FF', label: 'Customer Called',  weight: 'fill' },
  customer_cancelled: { icon: 'XCircle',       color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled',        weight: 'fill' },
  queue_created:      { icon: 'PlusCircle',    color: '#1D4ED8', bg: '#EFF6FF', label: 'Queue Created',    weight: 'bold' },
  queue_deleted:      { icon: 'Trash',         color: '#991B1B', bg: '#FEF2F2', label: 'Queue Deleted',    weight: 'bold' },
  queue_updated:      { icon: 'Pencil',        color: '#D97706', bg: '#FFFBEB', label: 'Queue Updated',    weight: 'bold' },
  new_queue:          { icon: 'Storefront',    color: '#059669', bg: '#ECFDF5', label: 'New Queue',        weight: 'fill' },
  info:               { icon: 'Info',          color: '#6B7280', bg: '#F3F4F6', label: 'Info',             weight: 'bold' },
};

// ── Helper Functions ─────────────────────────────────────────────────────
function getNotifCategory(notification: AppNotification): NotifCategory {
  const title = (notification.title || '').toLowerCase();
  const message = (notification.message || '').toLowerCase();

  if (title.includes('joined') || message.includes('joined')) return 'customer_joined';
  if (title.includes('left') || message.includes('left')) return 'customer_left';
  if (title.includes('service complete') || title.includes('served') || message.includes('been served')) return 'customer_served';
  if (title.includes('called') || message.includes('called to')) return 'customer_called';
  if (title.includes('cancelled') || title.includes('removed') || message.includes('cancelled')) return 'customer_cancelled';
  if (title.includes('created') || message.includes('has been opened')) return 'queue_created';
  if (title.includes('deleted') || title.includes('closed') || message.includes('has been closed')) return 'queue_deleted';
  if (title.includes('updated') || message.includes('updated')) return 'queue_updated';
  if (title.includes('new queue') || title.includes('available')) return 'new_queue';

  return 'info';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function getDateGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dDate.getTime() >= today.getTime()) return 'Today';
  if (dDate.getTime() >= yesterday.getTime()) return 'Yesterday';
  if (dDate.getTime() >= weekAgo.getTime()) return 'This Week';
  return 'Earlier';
}

// ── Notification Item Component ──────────────────────────────────────────
function NotificationItem({
  notification,
  onPress,
  onDelete,
  isDeleting,
}: {
  notification: AppNotification;
  onPress: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const category = getNotifCategory(notification);
  const config = NOTIF_CONFIG[category];
  const isUnread = !notification.is_read;
  const isHighPriority = notification.priority === 'high';

  return (
    <TouchableOpacity
      style={[
        styles.notifCard,
        isUnread && styles.notifCardUnread,
        isHighPriority && isUnread && styles.notifCardHighPriority,
      ]}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.65}
      delayLongPress={500}
      delayPressIn={0}
      pressRetentionOffset={{ top: 10, left: 10, bottom: 10, right: 10 }}
    >
      {/* Left Icon Column */}
      <View style={styles.iconColumn}>
        <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
          <PhosphorIcon
            icon={config.icon}
            size={22}
            color={config.color}
            weight={config.weight}
          />
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Content Column */}
      <View style={styles.contentColumn}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.categoryBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.categoryText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
            {isHighPriority && isUnread && (
              <View style={styles.priorityBadge}>
                <PhosphorIcon icon="WarningOctagon" size={10} color="#DC2626" weight="fill" />
                <Text style={styles.priorityText}>Priority</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
        </View>

        {/* Title */}
        <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={2}>
          {notification.title}
        </Text>

        {/* Message */}
        <Text style={styles.notifMessage} numberOfLines={2}>
          {notification.message}
        </Text>

        {/* Action Footer */}
        <View style={styles.cardFooter}>
          {category === 'customer_called' || category === 'customer_joined' || category === 'queue_created' ? (
            <View style={styles.actionHint}>
              <PhosphorIcon icon="ArrowRight" size={12} color={COLORS.red} weight="bold" />
              <Text style={styles.actionHintText}>Tap to view details</Text>
            </View>
          ) : (
            <View style={styles.actionHint}>
              <PhosphorIcon
                icon={isUnread ? 'Envelope' : 'CheckCircle'}
                size={12}
                color={isUnread ? COLORS.blue : COLORS.gray400}
                weight={isUnread ? 'fill' : 'bold'}
              />
              <Text style={[styles.actionHintText, { color: isUnread ? COLORS.blue : COLORS.gray400 }]}>
                {isUnread ? 'Tap to mark read' : 'Long press to delete'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.deleteIconBtn}
            onPress={onDelete}
            disabled={isDeleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={COLORS.red} />
            ) : (
              <PhosphorIcon icon="Trash" size={16} color={COLORS.gray300} weight="bold" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Empty State Component ─────────────────────────────────────────────────
function EmptyNotifications() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <PhosphorIcon icon="Bell" size={48} color={COLORS.gray300} weight="duotone" />
      </View>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySub}>
        No notifications yet. You'll be notified about queue activity and customer actions.
      </Text>
      <View style={styles.emptyFeatures}>
        <View style={styles.emptyFeature}>
          <PhosphorIcon icon="CheckCircle" size={16} color={COLORS.green} weight="fill" />
          <Text style={styles.emptyFeatureText}>Customer join/leave alerts</Text>
        </View>
        <View style={styles.emptyFeature}>
          <PhosphorIcon icon="CheckCircle" size={16} color={COLORS.green} weight="fill" />
          <Text style={styles.emptyFeatureText}>Queue status changes</Text>
        </View>
        <View style={styles.emptyFeature}>
          <PhosphorIcon icon="CheckCircle" size={16} color={COLORS.green} weight="fill" />
          <Text style={styles.emptyFeatureText}>Service completions</Text>
        </View>
      </View>
    </View>
  );
}

// ── Main Component ───────────────────────────────────────────────────────
export default function StaffNotificationsScreen() {
  console.log('[Staff Notifications] Rendering');
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    deleteOne,
    clearAllRead,
    fetchNotifications,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {};
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];

    notifications.forEach((n) => {
      const group = getDateGroup(n.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });

    const ordered: Record<string, AppNotification[]> = {};
    order.forEach((key) => {
      if (groups[key] && groups[key].length > 0) {
        ordered[key] = groups[key];
      }
    });
    Object.keys(groups).forEach((key) => {
      if (!ordered[key]) ordered[key] = groups[key];
    });

    return ordered;
  }, [notifications]);

  const handlePress = useCallback((notification: AppNotification) => {
    if (!notification.is_read) {
      markOneRead(notification.id);
    }
    const category = getNotifCategory(notification);
    if (
      category === 'customer_joined' ||
      category === 'customer_called' ||
      category === 'queue_created'
    ) {
      router.push('/(staff)/dashboard');
    }
  }, [markOneRead, router]);

  const handleDelete = useCallback(async (id: string) => {
    const choice = await showConfirm({
      title: 'Delete Notification',
      message: 'Remove this notification permanently?',
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Delete', style: 'destructive' },
      ],
    });

    if (choice !== 'Delete') return;
    setDeletingIds((prev) => new Set(prev).add(id));
    await deleteOne(id);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [deleteOne, showConfirm]);

  const handleClearAll = useCallback(async () => {
    const readCount = notifications.filter((n) => n.is_read).length;
    if (readCount === 0) {
      showToast({ title: 'Nothing to Clear', message: 'You have no read notifications to remove.', variant: 'info' });
      return;
    }

    const choice = await showConfirm({
      title: 'Clear Read Notifications',
      message: `Remove all ${readCount} read notifications? This cannot be undone.`,
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Clear All', style: 'destructive' },
      ],
    });

    if (choice === 'Clear All') {
      await clearAllRead();
    }
  }, [notifications, clearAllRead, showConfirm, showToast]);

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const choice = await showConfirm({
      title: 'Mark All Read',
      message: `Mark all ${unreadCount} unread notifications as read?`,
      options: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Mark All' },
      ],
    });
    if (choice === 'Mark All') {
      await markAllRead();
    }
  }, [unreadCount, markAllRead, showConfirm]);

  if (loading && notifications.length === 0) {
    return (
      <SafeScreen style={styles.container}>
        <StaffHeader
          title="Alerts"
          subtitle="Stay updated with queue activity"
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.red} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <StaffHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread · ${notifications.length} total`
            : notifications.length > 0
              ? `${notifications.length} notifications`
              : 'Stay updated with queue activity'
        }
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.headerMarkAllBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <PhosphorIcon icon="CheckCircle" size={20} color={COLORS.white} weight="fill" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBarBtn, unreadCount === 0 && styles.actionBarBtnDisabled]}
            onPress={handleMarkAllRead}
            disabled={unreadCount === 0}
            activeOpacity={0.7}
          >
            <PhosphorIcon
              icon="Envelope"
              size={14}
              color={unreadCount > 0 ? COLORS.blue : COLORS.gray400}
              weight="bold"
            />
            <Text
              style={[
                styles.actionBarBtnText,
                { color: unreadCount > 0 ? COLORS.blue : COLORS.gray400 },
              ]}
            >
              Mark All Read ({unreadCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBarBtn,
              styles.actionBarBtnDanger,
              notifications.filter((n) => n.is_read).length === 0 && styles.actionBarBtnDisabled,
            ]}
            onPress={handleClearAll}
            disabled={notifications.filter((n) => n.is_read).length === 0}
            activeOpacity={0.7}
          >
            <PhosphorIcon
              icon="Trash"
              size={14}
              color={
                notifications.filter((n) => n.is_read).length > 0
                  ? COLORS.red
                  : COLORS.gray400
              }
              weight="bold"
            />
            <Text
              style={[
                styles.actionBarBtnText,
                {
                  color:
                    notifications.filter((n) => n.is_read).length > 0
                      ? COLORS.red
                      : COLORS.gray400,
                },
              ]}
            >
              Clear Read ({notifications.filter((n) => n.is_read).length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.red}
              colors={[COLORS.red]}
            />
          }
        >
          {Object.entries(groupedNotifications).map(([group, items]) => (
            <View key={group} style={styles.section}>
              <View style={styles.sectionHeader}>
                <SectionLabel>{group}</SectionLabel>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{items.length}</Text>
                </View>
              </View>

              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handlePress(notification)}
                  onDelete={() => handleDelete(notification.id)}
                  isDeleting={deletingIds.has(notification.id)}
                />
              ))}
            </View>
          ))}

          <View style={styles.footer}>
            <PhosphorIcon icon="Bell" size={14} color={COLORS.gray300} weight="bold" />
            <Text style={styles.footerText}>BeeMacQueue CDO · Real-time notifications</Text>
          </View>
        </ScrollView>
      )}
    </SafeScreen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  headerMarkAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  actionBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.blueLight,
  },
  actionBarBtnDanger: {
    backgroundColor: COLORS.redLight,
  },
  actionBarBtnDisabled: {
    opacity: 0.5,
  },
  actionBarBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 36,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionCount: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  notifCardUnread: {
    backgroundColor: '#F8F9FF',
  },
  notifCardHighPriority: {
    backgroundColor: '#FFFBFB',
  },
  iconColumn: {
    marginRight: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
    marginTop: 4,
  },
  contentColumn: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#DC2626',
  },
  timeText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: 4,
    lineHeight: 20,
  },
  notifTitleUnread: {
    fontWeight: '800',
    color: COLORS.gray900,
  },
  notifMessage: {
    fontSize: 13,
    color: COLORS.gray500,
    lineHeight: 19,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray50,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  deleteIconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray700,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyFeatures: {
    gap: 10,
    width: '100%',
  },
  emptyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyFeatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.gray300,
    fontWeight: '500',
  },
});