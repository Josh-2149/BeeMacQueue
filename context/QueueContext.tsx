import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { QueueEntry } from '../types';

interface QueueContextType {
  activeQueue: QueueEntry | null;
  history: QueueEntry[];
  loading: boolean;
  joining: boolean;
  joinQueue: (queueId: string) => Promise<number>;
  leaveQueue: () => Promise<void>;
  refreshActive: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [activeQueue, setActiveQueue] = useState<QueueEntry | null>(null);
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchActive = useCallback(async () => {
    if (!user) {
      setActiveQueue(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          queue:queues(*),
          establishment:establishments(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['waiting', 'serving'])
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      setActiveQueue(data as QueueEntry | null);
    } catch (err) {
      console.log('🎫 [useQueue] Error fetching active:', err);
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
        .select(`
          *,
          queue:queues(*),
          establishment:establishments(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data as QueueEntry[] || []);
    } catch (err) {
      console.log('🎫 [useQueue] Error fetching history:', err);
    }
  }, [user]);

  const joinQueue = useCallback(async (queueId: string): Promise<number> => {
    if (!user) throw new Error('Not logged in');
    if (activeQueue) throw new Error('Already in a queue');

    setJoining(true);
    try {
      // Get queue details
      const { data: queue, error: qErr } = await supabase
        .from('queues')
        .select('establishment_id, name')
        .eq('id', queueId)
        .single();
      if (qErr) throw new Error('Queue not found');

      // Get next ticket number
      const { data: maxTicket, error: maxErr } = await supabase
        .from('queue_entries')
        .select('ticket_number')
        .eq('queue_id', queueId)
        .order('ticket_number', { ascending: false })
        .limit(1);
      if (maxErr) throw maxErr;
      const nextNumber = (maxTicket && maxTicket.length > 0) ? maxTicket[0].ticket_number + 1 : 1;

      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          user_id: user.id,
          queue_id: queueId,
          establishment_id: queue.establishment_id,
          ticket_number: nextNumber,
          status: 'waiting',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update profile
      await supabase
        .from('profiles')
        .update({ queues_joined: (profile?.queues_joined || 0) + 1 })
        .eq('id', user.id);

      await fetchActive();
      return data.ticket_number;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  }, [user, activeQueue, profile, fetchActive]);

  const leaveQueue = useCallback(async () => {
    if (!activeQueue || !user) return;

    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', activeQueue.id)
        .eq('user_id', user.id);

      if (error) throw error;
      setActiveQueue(null);
      await fetchHistory();
    } catch (err) {
      console.log('🎫 [useQueue] Error leaving queue:', err);
    }
  }, [activeQueue, user, fetchHistory]);

  const refreshActive = useCallback(async () => {
    await fetchActive();
  }, [fetchActive]);

  useEffect(() => {
    fetchActive();
    fetchHistory();

    if (!user) return;

    // Realtime subscription
    const channel = supabase
      .channel(`queue-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_entries',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchActive();
        fetchHistory();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchActive, fetchHistory]);

  return (
    <QueueContext.Provider value={{
      activeQueue,
      history,
      loading,
      joining,
      joinQueue,
      leaveQueue,
      refreshActive,
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueueContext() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueueContext must be used within a QueueProvider');
  }
  return context;
}