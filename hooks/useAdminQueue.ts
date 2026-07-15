import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QueueEntry } from '../types';

export function useAdminQueue() {
  const [liveQueue, setLiveQueue] = useState<QueueEntry[]>([]);
  const [servedToday, setServedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLive = useCallback(async () => {
    const { data } = await supabase
      .from('queue_entries')
      .select('*, user:profiles(id,name,email), establishment:establishments(id,name,branch,brand,next_serving,avg_wait_mins)')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });
    setLiveQueue((data as QueueEntry[]) ?? []);
    setLoading(false);
  }, []);

  const fetchServedToday = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('queue_entries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'served')
      .gte('created_at', today.toISOString());
    setServedToday(count ?? 0);
  }, []);

  useEffect(() => {
    fetchLive();
    fetchServedToday();

    const channel = supabase
      .channel('admin-queue-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' },
        () => { fetchLive(); fetchServedToday(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLive, fetchServedToday]);

  async function serveTicket(entry: QueueEntry) {
    await supabase.from('queue_entries')
      .update({ status: 'served' })
      .eq('id', entry.id);

    const est = entry.establishment as any;
    if (est?.id) {
      await supabase.from('establishments')
        .update({ next_serving: (est.next_serving ?? 1) + 1 })
        .eq('id', est.id);
    }

    await supabase.from('notifications').insert({
      user_id: entry.user_id,
      title: '✅ Your turn!',
      message: `Ticket #${entry.ticket_number} at ${est?.name} ${est?.branch} — please proceed to the counter now!`,
      type: 'serve',
    });
  }

  async function cancelTicket(entry: QueueEntry) {
    await supabase.from('queue_entries')
      .update({ status: 'cancelled' })
      .eq('id', entry.id);

    await supabase.from('notifications').insert({
      user_id: entry.user_id,
      title: '❌ Queue cancelled',
      message: `Ticket #${entry.ticket_number} at ${(entry.establishment as any)?.name} was cancelled by the admin.`,
      type: 'info',
    });
  }

  return { liveQueue, servedToday, loading, serveTicket, cancelTicket, refresh: fetchLive };
}
