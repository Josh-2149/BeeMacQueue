import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';

console.log('🔔 [useNotifications] Module loaded');

const channelLocks = new Map<string, Promise<void>>();
const sharedState = new Map<string, {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetch: () => Promise<void>;
  setState: (n: AppNotification[], u: number) => void;
}>();

export function useNotifications(userId: string | undefined) {
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>([]);
  const [localUnread, setLocalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const instanceId = useRef(`n${Math.random().toString(36).slice(2, 6)}`);

  console.log(`🔔 [useNotifications #${instanceId.current}] Called, userId: ${userId || 'undefined'}`);

  const doFetch = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = (data as AppNotification[]) ?? [];
      const unread = list.filter((n) => !n.is_read).length;
      if (isMounted.current) {
        setLocalNotifications(list);
        setLocalUnread(unread);
        setLoading(false);
        sharedState.set(userId, {
          notifications: list,
          unreadCount: unread,
          loading: false,
          fetch: doFetch,
          setState: (n, u) => {
            setLocalNotifications(n);
            setLocalUnread(u);
          },
        });
      }
    } catch (err) {
      console.log('🔔 [useNotifications] Fetch error:', err);
      if (isMounted.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;
    if (!userId) {
      setLocalNotifications([]);
      setLocalUnread(0);
      setLoading(false);
      return;
    }

    doFetch();

    if (!channelLocks.has(userId)) {
      const lock = new Promise<void>((resolve) => {
        const channel = supabase.channel(`notifs-${userId}`);
        channel
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          }, (payload) => {
            const n = payload.new as AppNotification;
            setLocalNotifications((prev) => {
              if (prev.some(item => item.id === n.id)) return prev;
              return [n, ...prev];
            });
            setLocalUnread((c) => c + 1);
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          }, () => {
            doFetch();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') resolve();
          });
      });
      channelLocks.set(userId, lock);
    }

    const lock = channelLocks.get(userId)!;
    lock.then(() => {
      const existing = sharedState.get(userId);
      if (existing) {
        setLocalNotifications(existing.notifications);
        setLocalUnread(existing.unreadCount);
        setLoading(false);
      }
    });

    return () => { isMounted.current = false; };
  }, [userId, doFetch]);

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    const updated = localNotifications.map((n) => ({ ...n, is_read: true }));
    setLocalNotifications(updated);
    setLocalUnread(0);
    const entry = sharedState.get(userId);
    if (entry) {
      sharedState.set(userId, { ...entry, notifications: updated, unreadCount: 0 });
    }
  };

  const markOneRead = async (id: string) => {
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    const updated = localNotifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setLocalNotifications(updated);
    const newUnread = updated.filter((n) => !n.is_read).length;
    setLocalUnread(newUnread);
    const entry = sharedState.get(userId);
    if (entry) {
      sharedState.set(userId, { ...entry, notifications: updated, unreadCount: newUnread });
    }
  };

  const addNotification = useCallback(async (data: {
    user_id: string;
    title: string;
    message: string;
    type?: 'queue' | 'serve' | 'info';
    priority?: 'high' | 'normal' | 'low';
    metadata?: any;
  }) => {
    if (!data.user_id) return false;
    const { error } = await supabase.from('notifications').insert({
      ...data,
      type: data.type || 'info',
      priority: data.priority || 'normal',
      is_read: false,
      metadata: data.metadata || {},
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.log('🔔 Insert error:', error.message);
      return false;
    }
    return true;
  }, []);

  return {
    notifications: localNotifications,
    unreadCount: localUnread,
    loading,
    fetchNotifications: doFetch,
    markAllRead,
    markOneRead,
    addNotification,
  };
}