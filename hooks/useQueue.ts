import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QueueEntry } from '../types';

export function useQueue(userId: string | undefined) {
  const [activeQueue, setActiveQueue] = useState<QueueEntry | null>(null);
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchActive = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('queue_entries')
      .select('*, establishment:establishments(*)')
      .eq('user_id', userId)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('fetchActive error', error);
      setActiveQueue(null);
      return;
    }
    setActiveQueue(data as QueueEntry | null);
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('queue_entries')
      .select('*, establishment:establishments(id,name,branch,brand)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) {
      console.error('fetchHistory error', error);
      setHistory([]);
      return;
    }
    setHistory((data as QueueEntry[]) ?? []);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([fetchActive(), fetchHistory()]).finally(() => setLoading(false));

    const channel = supabase
      .channel(`queue-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: 'queue_entries',
          filter: `user_id=eq.${userId}`,
        },
        () => { fetchActive(); fetchHistory(); }
      );
    try {
      // @ts-ignore
      channel.subscribe();
    } catch (e) {
      console.warn('subscribe error for queue channel', e);
    }

    const estChannel = supabase
      .channel(`est-for-queue-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'establishments' }, (p) => {
        try {
          const newRec = (p as any)?.new;
          if (!newRec) return;
          setActiveQueue((prev) => {
            if (!prev) return null;
            if (prev.establishment_id === newRec.id) {
              return { ...prev, establishment: newRec as any };
            }
            return prev;
          });
        } catch (err) {
          console.warn('estChannel handler error', err);
        }
      });
    try {
      // @ts-ignore
      estChannel.subscribe();
    } catch (e) {
      console.warn('subscribe error for est channel', e);
    }

    return () => {
      try {
        // @ts-ignore
        if (channel) supabase.removeChannel(channel);
        // @ts-ignore
        if (estChannel) supabase.removeChannel(estChannel);
      } catch (e) {
        console.warn('error removing channels', e);
      }
    };
  }, [userId, fetchActive, fetchHistory]);

  async function joinQueue(establishmentId: string): Promise<number> {
    if (!userId) throw new Error('Not logged in');
    setJoining(true);
    try {
      const { data: existing, error: existingErr } = await supabase
        .from('queue_entries')
        .select('id, ticket_number, establishment:establishments(name,branch)')
        .eq('user_id', userId)
        .eq('status', 'waiting')
        .maybeSingle();

      if (existingErr) console.error('joinQueue existing lookup error', existingErr);

      if (existing) {
        const est = existing.establishment as any;
        throw new Error(
          `You already have ticket #${existing.ticket_number} at ${est?.name} ${est?.branch}.`
        );
      }

      const { data: est, error: estErr } = await supabase
        .from('establishments')
        .select('current_queue, avg_wait_mins, name, branch, is_open')
        .eq('id', establishmentId)
        .single();

      if (estErr || !est) throw new Error('Branch not found.');
      if (!est.is_open) throw new Error('This branch is currently closed.');

      const ticketNumber = (est.current_queue ?? 0) + 1;

      const { error: insertErr } = await supabase.from('queue_entries').insert({
        user_id: userId,
        establishment_id: establishmentId,
        ticket_number: ticketNumber,
        status: 'waiting',
      });
      if (insertErr) throw new Error(insertErr.message);

      await supabase.from('establishments')
        .update({ current_queue: ticketNumber })
        .eq('id', establishmentId);

      // Increment queues_joined
      const { data: p, error: pErr } = await supabase
        .from('profiles').select('queues_joined').eq('id', userId).single();
      if (pErr) console.warn('profiles lookup error', pErr);
      await supabase.from('profiles')
        .update({ queues_joined: ((p as any)?.queues_joined ?? 0) + 1 })
        .eq('id', userId);

      const aheadCount = ticketNumber - 1;
      const estWait = aheadCount * (est.avg_wait_mins ?? 5);
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎫 Queue joined!',
        message: `Ticket #${ticketNumber} · ${est.name} ${est.branch} · ${
          aheadCount > 0 ? `~${estWait} min wait` : "You're next!"
        }`,
        type: 'queue',
      });

      await fetchActive();
      await fetchHistory();
      return ticketNumber;
    } finally {
      setJoining(false);
    }
  }

  async function leaveQueue() {
    if (!activeQueue) return;
    await supabase.from('queue_entries')
      .update({ status: 'cancelled' })
      .eq('id', activeQueue.id);
    setActiveQueue(null);
    await fetchHistory();
  }

  async function refreshActive() {
    await fetchActive();
  }

  return { activeQueue, history, loading, joining, joinQueue, leaveQueue, refreshActive };
}
