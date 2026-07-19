import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { QueueEntry } from '../types';

interface QueueContextType {
  activeQueue: QueueEntry | null;
  history: QueueEntry[];
  loading: boolean;
  joining: boolean;
  joinQueue: (queueId: string) => Promise<number>;
  leaveQueue: () => Promise<void>;
  refreshActive: () => Promise<void>;
  completedTodayQueueIds: string[];
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [activeQueue, setActiveQueue] = useState<QueueEntry | null>(null);
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [completedTodayQueueIds, setCompletedTodayQueueIds] = useState<string[]>([]);
  const { addNotification } = useNotifications(user?.id);

  const fetchCompletedToday = useCallback(async () => {
    if (!user) {
      setCompletedTodayQueueIds([]);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('queue_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('served_at', `${today}T00:00:00`)
        .lte('served_at', `${today}T23:59:59`);
      if (error) throw error;
      const ids = (data || []).map((e: any) => e.queue_id);
      setCompletedTodayQueueIds(ids);
    } catch (err) {
      console.log('🎫 [QueueContext] Error fetching completed today:', err);
    }
  }, [user]);

  const fetchActive = useCallback(async () => {
    if (!user) {
      setActiveQueue(null);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`*, queue:queues(*), establishment:establishments(*)`)
        .eq('user_id', user.id)
        .in('status', ['waiting', 'serving'])
        .order('created_at', { ascending: false })
        .maybeSingle();
      if (error) throw error;
      setActiveQueue(data as QueueEntry | null);
    } catch (err) {
      console.log('🎫 [QueueContext] Error fetching active:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`*, queue:queues(*), establishment:establishments(*)`)
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setHistory(data as QueueEntry[] || []);
    } catch (err) {
      console.log('🎫 [QueueContext] Error fetching history:', err);
    }
  }, [user]);

  const notifyStaffInBranch = useCallback(async (title: string, message: string) => {
    if (!user || !profile) return;
    try {
      const { data: staffMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'staff');
      if (staffMembers) {
        for (const staff of staffMembers) {
          await addNotification({
            user_id: staff.id,
            title,
            message,
            type: 'queue',
            priority: 'high',
            metadata: { customer_id: user.id, customer_name: profile.name || 'Customer', timestamp: new Date().toISOString() },
          });
        }
      }
    } catch (err) {
      console.log('🎫 Error notifying staff:', err);
    }
  }, [user, profile, addNotification]);

  const joinQueue = useCallback(async (queueId: string): Promise<number> => {
    if (!user) throw new Error('Not logged in');

    const { data: existingActive } = await supabase
      .from('queue_entries')
      .select('id, ticket_number')
      .eq('user_id', user.id)
      .in('status', ['waiting', 'serving'])
      .maybeSingle();

    if (existingActive) {
      throw new Error(`Already in queue with ticket #${existingActive.ticket_number}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: completedToday } = await supabase
      .from('queue_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('queue_id', queueId)
      .eq('status', 'completed')
      .gte('served_at', `${today}T00:00:00`)
      .lte('served_at', `${today}T23:59:59`)
      .maybeSingle();

    if (completedToday) {
      throw new Error('You have already been served in this queue today. Please try again tomorrow.');
    }

    setJoining(true);
    try {
      const { data: queueData, error: qErr } = await supabase
        .from('queues')
        .select('*, establishment:establishments(*)')
        .eq('id', queueId)
        .single();
      if (qErr) throw new Error('Queue not found');

      const { count, error: countErr } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('queue_id', queueId)
        .in('status', ['waiting', 'serving']);

      if (countErr) throw countErr;

      // 🆕 CAPACITY CHECK
      const capacity = queueData.capacity || 50;
      const currentCount = count || 0;
      if (currentCount >= capacity) {
        throw new Error(`Queue is full! Capacity: ${capacity}. Please try again later.`);
      }

      const nextNumber = currentCount + 1;

      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          user_id: user.id,
          queue_id: queueId,
          establishment_id: queueData.establishment_id,
          ticket_number: nextNumber,
          status: 'waiting',
          priority: 0,
          party_size: 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ queues_joined: (profile?.queues_joined || 0) + 1 })
        .eq('id', user.id);

      await addNotification({
        user_id: user.id,
        title: '🎫 Joined Queue',
        message: `You joined "${queueData.name}" at ${queueData.establishment?.name || 'branch'} — Ticket #${nextNumber}`,
        type: 'queue',
        priority: 'high',
        metadata: { queue_id: queueId, ticket_number: nextNumber },
      });

      await notifyStaffInBranch(
        '👤 New Customer',
        `${profile?.name || 'Customer'} joined "${queueData.name}" — Ticket #${nextNumber}`
      );

      await fetchActive();
      await fetchHistory();
      await fetchCompletedToday();

      return data.ticket_number;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  }, [user, profile, fetchActive, fetchHistory, fetchCompletedToday, addNotification, notifyStaffInBranch]);

  const leaveQueue = useCallback(async () => {
    if (!activeQueue || !user) return;
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', activeQueue.id)
        .eq('user_id', user.id);
      if (error) throw error;

      await addNotification({
        user_id: user.id,
        title: '👋 Left Queue',
        message: `You left "${activeQueue.queue?.name || 'queue'}" — Ticket #${activeQueue.ticket_number} cancelled`,
        type: 'queue',
        priority: 'normal',
        metadata: { ticket_number: activeQueue.ticket_number },
      });

      await notifyStaffInBranch(
        '🚶 Customer Left',
        `${profile?.name || 'Customer'} left "${activeQueue.queue?.name || 'queue'}" — Ticket #${activeQueue.ticket_number}`
      );

      setActiveQueue(null);
      await fetchHistory();
      await fetchCompletedToday();
    } catch (err) {
      console.log('🎫 [QueueContext] Error leaving queue:', err);
    }
  }, [activeQueue, user, profile, fetchHistory, fetchCompletedToday, addNotification, notifyStaffInBranch]);

  const refreshActive = useCallback(async () => {
    await fetchActive();
    await fetchHistory();
    await fetchCompletedToday();
  }, [fetchActive, fetchHistory, fetchCompletedToday]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!user) {
        if (isMounted) {
          setActiveQueue(null);
          setHistory([]);
          setCompletedTodayQueueIds([]);
          setLoading(false);
        }
        return;
      }
      await Promise.all([fetchActive(), fetchHistory(), fetchCompletedToday()]);
    };
    loadData();
    if (!user?.id) return;
    const channel = supabase
      .channel(`queue-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries', filter: `user_id=eq.${user.id}` }, () => {
        if (isMounted) {
          fetchActive();
          fetchHistory();
          fetchCompletedToday();
        }
      })
      .subscribe();
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <QueueContext.Provider value={{
      activeQueue, history, loading, joining,
      joinQueue, leaveQueue, refreshActive, completedTodayQueueIds,
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueueContext() {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueueContext must be used within a QueueProvider');
  return context;
}