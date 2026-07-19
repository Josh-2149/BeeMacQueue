import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';

console.log('🔔 [useNotifications] Module loaded');

// ── Shared State (one per userId) ────────────────────────────────────────
interface SharedState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  subscribers: Set<() => void>;
  channel: any;
  channelCreating: boolean; // 🆕 Lock to prevent duplicate channel creation
}

const sharedStateMap = new Map<string, SharedState>();

function getOrCreateSharedState(userId: string): SharedState {
  if (!sharedStateMap.has(userId)) {
    sharedStateMap.set(userId, {
      notifications: [],
      unreadCount: 0,
      loading: true,
      subscribers: new Set(),
      channel: null,
      channelCreating: false,
    });
  }
  return sharedStateMap.get(userId)!;
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useNotifications(userId: string | undefined) {
  const [localNotifications, setLocalNotifications] = useState<AppNotification[]>([]);
  const [localUnread, setLocalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const instanceId = useRef(`n${Math.random().toString(36).slice(2, 6)}`);
  const callbackRef = useRef<(() => void) | null>(null);

  console.log(`🔔 [useNotifications #${instanceId.current}] Called, userId: ${userId || 'undefined'}`);

  // ── Fetch ──────────────────────────────────────────────────────────────
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

      // Update shared state
      const shared = sharedStateMap.get(userId);
      if (shared) {
        shared.notifications = list;
        shared.unreadCount = unread;
        shared.loading = false;
        // Notify all subscribers
        shared.subscribers.forEach((cb) => cb());
      }

      if (isMounted.current) {
        setLocalNotifications(list);
        setLocalUnread(unread);
        setLoading(false);
      }
    } catch (err) {
      console.log('🔔 [useNotifications] Fetch error:', err);
      if (isMounted.current) setLoading(false);
    }
  }, [userId]);

  // ── Setup Channel (ONCE per userId with lock) ──────────────────────────
  const setupChannel = useCallback(async (uid: string) => {
    const shared = getOrCreateSharedState(uid);

    // 🆕 If channel is already being created, wait
    if (shared.channelCreating) {
      console.log(`🔔 [useNotifications] Channel already being created for ${uid}, waiting...`);
      // Wait for existing creation to finish
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (!shared.channelCreating && shared.channel) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      return;
    }

    // Already have a channel — nothing to do
    if (shared.channel) {
      console.log(`🔔 [useNotifications] Channel already exists for ${uid}`);
      return;
    }

    // 🆕 Set lock and create channel
    shared.channelCreating = true;
    console.log(`🔔 [useNotifications] Creating channel for userId: ${uid}`);

    try {
      const channel = supabase
        .channel(`notifs-${uid}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        }, (payload) => {
          const n = payload.new as AppNotification;
          const currentShared = sharedStateMap.get(uid);
          if (currentShared) {
            // Deduplicate
            if (!currentShared.notifications.some((item) => item.id === n.id)) {
              currentShared.notifications = [n, ...currentShared.notifications];
              currentShared.unreadCount += 1;
              currentShared.subscribers.forEach((cb) => cb());
            }
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        }, () => {
          doFetch();
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        }, () => {
          doFetch();
        })
        .subscribe((status) => {
          console.log(`🔔 [useNotifications] Channel status for ${uid}: ${status}`);
        });

      shared.channel = channel;
    } catch (err) {
      console.log(`🔔 [useNotifications] Channel creation error:`, err);
    } finally {
      shared.channelCreating = false;
    }
  }, [doFetch]);

  // ── Subscribe to shared state ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setLocalNotifications([]);
      setLocalUnread(0);
      setLoading(false);
      return;
    }

    const shared = getOrCreateSharedState(userId);

    // Create subscriber callback
    const callback = () => {
      const currentShared = sharedStateMap.get(userId);
      if (currentShared && isMounted.current) {
        setLocalNotifications(currentShared.notifications);
        setLocalUnread(currentShared.unreadCount);
        setLoading(currentShared.loading);
      }
    };

    callbackRef.current = callback;
    shared.subscribers.add(callback);

    // Set initial state from shared
    setLocalNotifications(shared.notifications);
    setLocalUnread(shared.unreadCount);
    setLoading(shared.loading);

    return () => {
      shared.subscribers.delete(callback);
      callbackRef.current = null;
    };
  }, [userId]);

  // ── Initialize channel + fetch ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const init = async () => {
      await setupChannel(userId);
      if (!cancelled) {
        await doFetch();
      }
    };

    init();

    return () => {
      cancelled = true;
      // Cleanup channel when ALL subscribers are gone
      // (handled in the next tick to avoid race conditions)
      setTimeout(() => {
        const shared = sharedStateMap.get(userId);
        if (shared && shared.subscribers.size === 0 && shared.channel) {
          console.log(`🔔 [useNotifications] Removing channel for userId: ${userId} (no subscribers)`);
          supabase.removeChannel(shared.channel);
          shared.channel = null;
          sharedStateMap.delete(userId);
        }
      }, 500);
    };
  }, [userId, setupChannel, doFetch]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    await doFetch();
  };

  const markOneRead = async (id: string) => {
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    await doFetch();
  };

  const deleteOne = useCallback(async (id: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await doFetch();
    } catch (err) {
      console.log('🔔 Delete error:', err);
    }
  }, [userId, doFetch]);

  const clearAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);
      if (error) throw error;
      await doFetch();
    } catch (err) {
      console.log('🔔 Clear all error:', err);
    }
  }, [userId, doFetch]);

  const addNotification = useCallback(async (data: {
    user_id: string;
    title: string;
    message: string;
    type?: 'queue' | 'serve' | 'info';
    priority?: 'high' | 'normal' | 'low';
    metadata?: any;
  }) => {
    if (!data.user_id) return false;
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
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
    } catch (err: any) {
      console.log('🔔 Insert error:', err.message);
      return false;
    }
  }, []);

  return {
    notifications: localNotifications,
    unreadCount: localUnread,
    loading,
    fetchNotifications: doFetch,
    markAllRead,
    markOneRead,
    deleteOne,
    clearAllRead,
    addNotification,
  };
}