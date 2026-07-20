import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { QueueEntry } from '../types';

interface QueueContextType {
  activeQueue: QueueEntry | null;
  history: QueueEntry[];
  loading: boolean;
  joining: boolean;
  peopleAhead: number;
  isYourTurn: boolean;
  estimatedWaitMins: number;
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
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [estimatedWaitMins, setEstimatedWaitMins] = useState(0);
  const [completedTodayQueueIds, setCompletedTodayQueueIds] = useState<string[]>([]);
  const { addNotification } = useNotifications(user?.id);
  const channelRef = useRef<any>(null);
  const activeQueueRef = useRef<QueueEntry | null>(null);

  // Keep a ref in sync so polling always has latest queue
  useEffect(() => {
    activeQueueRef.current = activeQueue;
  }, [activeQueue]);

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

  const calculatePosition = useCallback(async (entry: QueueEntry) => {
    if (!entry.queue_id || !entry.id) {
      setPeopleAhead(0);
      setIsYourTurn(false);
      setEstimatedWaitMins(0);
      return;
    }

    try {
      // Count how many waiting entries have a lower ticket_number in the same queue
      const { count, error } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('queue_id', entry.queue_id)
        .eq('status', 'waiting')
        .lt('ticket_number', entry.ticket_number);

      if (error) throw error;

      const ahead = count || 0;
      const isTurn = entry.status === 'serving' || ahead === 0;

      setPeopleAhead(ahead);
      setIsYourTurn(isTurn);

      // Estimate wait time
      const avgWait = entry.establishment?.avg_wait_mins ?? 5;
      setEstimatedWaitMins(ahead * avgWait);
    } catch (err) {
      console.log('🎫 [QueueContext] Error calculating position:', err);
    }
  }, []);

  const fetchActive = useCallback(async () => {
    if (!user) {
      setActiveQueue(null);
      setPeopleAhead(0);
      setIsYourTurn(false);
      setEstimatedWaitMins(0);
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

      const entry = data as QueueEntry | null;
      setActiveQueue(entry);

      if (entry) {
        await calculatePosition(entry);
      } else {
        setPeopleAhead(0);
        setIsYourTurn(false);
        setEstimatedWaitMins(0);
      }
    } catch (err) {
      console.log('🎫 [QueueContext] Error fetching active:', err);
    } finally {
      setLoading(false);
    }
  }, [user, calculatePosition]);

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

  const notifyStaffInBranch = useCallback(async (title: string, message: string, establishmentId?: string) => {
    if (!user || !profile) return;
    try {
      let staffMembers: any[] = [];
      
      if (establishmentId) {
        const { data: est } = await supabase
          .from('establishments')
          .select('brand, branch')
          .eq('id', establishmentId)
          .single();
        
        if (est) {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'staff')
            .eq('brand', est.brand)
            .eq('branch', est.branch);
          staffMembers = data || [];
        }
      }

      for (const staff of staffMembers) {
        await addNotification({
          user_id: staff.id,
          title,
          message,
          type: 'queue',
          priority: 'high',
          metadata: { 
            customer_id: user.id, 
            customer_name: profile.name || 'Customer', 
            timestamp: new Date().toISOString() 
          },
        });
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
      throw new Error('You have already been served in this queue today.');
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

      const capacity = queueData.capacity || 50;
      if ((count || 0) >= capacity) {
        throw new Error(`Queue is full! Capacity: ${capacity}.`);
      }

      const nextNumber = (count || 0) + 1;

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
        message: `You joined "${queueData.name}" — Ticket #${nextNumber}`,
        type: 'queue',
        priority: 'high',
        metadata: { queue_id: queueId, ticket_number: nextNumber },
      });

      await notifyStaffInBranch(
        '👤 New Customer',
        `${profile?.name || 'Customer'} joined "${queueData.name}" — Ticket #${nextNumber}`,
        queueData.establishment_id
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
        `${profile?.name || 'Customer'} left queue`,
        activeQueue.establishment_id
      );

      setActiveQueue(null);
      setPeopleAhead(0);
      setIsYourTurn(false);
      setEstimatedWaitMins(0);
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

  // Initial load
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!user) {
        if (isMounted) {
          setActiveQueue(null);
          setHistory([]);
          setCompletedTodayQueueIds([]);
          setPeopleAhead(0);
          setIsYourTurn(false);
          setLoading(false);
        }
        return;
      }
      await Promise.all([fetchActive(), fetchHistory(), fetchCompletedToday()]);
    };
    loadData();
  }, [user?.id]);

  // Real-time: Listen to user's own queue entries
  useEffect(() => {
    if (!user?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`queue-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue_entries', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchActive();
        fetchHistory();
        fetchCompletedToday();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // Recalculate position when activeQueue changes
  useEffect(() => {
    if (activeQueue) {
      calculatePosition(activeQueue);
    }
  }, [activeQueue, calculatePosition]);

  // ✅ POLLING: Recalculate position every 5 seconds while active
  useEffect(() => {
    if (!activeQueue || !user?.id) return;

    console.log('🎫 [QueueContext] 🔄 Starting position polling (5s interval)');
    const interval = setInterval(async () => {
      if (activeQueueRef.current) {
        await calculatePosition(activeQueueRef.current);
      }
    }, 5000);

    return () => {
      console.log('🎫 [QueueContext] 🛑 Stopping position polling');
      clearInterval(interval);
    };
  }, [activeQueue?.id, user?.id, calculatePosition]); // Restart polling when active queue changes

  return (
    <QueueContext.Provider value={{
      activeQueue, history, loading, joining,
      peopleAhead, isYourTurn, estimatedWaitMins,
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