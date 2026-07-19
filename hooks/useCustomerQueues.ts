// hooks/useCustomerQueues.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Queue, Establishment } from '../types';

export function useCustomerQueues() {
  const [queues, setQueues] = useState<(Queue & { establishment: Establishment; waitingCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    try {
      const { data: queuesData, error: qErr } = await supabase
        .from('queues')
        .select(`
          *,
          establishment:establishments(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (qErr) throw new Error(qErr.message);

      const queueIds = queuesData?.map((q: any) => q.id) || [];
      let waitingMap: Record<string, number> = {};
      if (queueIds.length > 0) {
        const { data: entries, error: eErr } = await supabase
          .from('queue_entries')
          .select('queue_id, status')
          .in('queue_id', queueIds)
          .eq('status', 'waiting');
        if (!eErr) {
          entries?.forEach((e: any) => {
            waitingMap[e.queue_id] = (waitingMap[e.queue_id] || 0) + 1;
          });
        }
      }

      const result = (queuesData || []).map((q: any) => ({
        ...q,
        waitingCount: waitingMap[q.id] || 0,
        establishment: q.establishment as Establishment,
      }));
      setQueues(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
    const channel = supabase
      .channel('customer-queues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => fetchQueues())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, () => fetchQueues())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchQueues]);

  return { queues, loading, error, refresh: fetchQueues };
}