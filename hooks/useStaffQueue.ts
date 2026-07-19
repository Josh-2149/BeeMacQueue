import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QueueEntry, Establishment } from '../types';
import { useNotifications } from './useNotifications';

console.log('🏪 [useStaffQueue] Module loaded');

interface StaffQueueStats {
  totalWaiting: number;
  totalServing: number;
  totalServed: number;
  todayServed: number;
}

interface StaffQueueData {
  waitingList: QueueEntry[];
  servingList: QueueEntry[];
  servedList: QueueEntry[];
  stats: StaffQueueStats;
  establishment: Establishment | null;
  queueTemplates: any[];
}

interface CreateQueueData {
  name: string;
  estimatedWait?: number;
  capacity?: number;
  status?: 'active' | 'paused' | 'closed';
}

export function useStaffQueue(staffId: string | undefined) {
  console.log(`🏪 [useStaffQueue] 🎯 Hook called with staffId: ${staffId || 'undefined'}`);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<StaffQueueData>({
    waitingList: [],
    servingList: [],
    servedList: [],
    stats: { totalWaiting: 0, totalServing: 0, totalServed: 0, todayServed: 0 },
    establishment: null,
    queueTemplates: [],
  });
  const [processing, setProcessing] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const channelRef = useRef<any>(null);
  const isMounted = useRef(true);
  const fetchCount = useRef(0);

  const { addNotification } = useNotifications(staffId);

  // Cleanup channel
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('🏪 [useStaffQueue] 📡 Cleaning up channel');
      try { supabase.removeChannel(channelRef.current); } catch (err) {}
      channelRef.current = null;
    }
  }, []);

  // Get establishment ID from staff profile
  useEffect(() => {
    let isActive = true;
    const getEstablishmentId = async () => {
      if (!staffId) {
        if (isActive) { setLoading(false); setError('No staff ID provided'); }
        return;
      }
      try {
        setError(null);
        const { data: profile, error: profileError } = await supabase
          .from('profiles').select('*').eq('id', staffId).single();
        if (profileError) {
          if (isActive) { setError(`Profile error: ${profileError.message}`); setLoading(false); }
          return;
        }
        if (isActive) setStaffProfile(profile);
        if (!profile.brand || !profile.branch) {
          if (isActive) { setError('Staff has no brand or branch assigned'); setLoading(false); }
          return;
        }
        let { data: est, error: estError } = await supabase
          .from('establishments').select('id, brand, branch, name')
          .eq('brand', profile.brand).eq('branch', profile.branch).maybeSingle();
        if (!est && profile.brand === 'mcdo') {
          const cleanBranch = profile.branch.replace("McDonald's ", "").trim();
          const { data: est2 } = await supabase
            .from('establishments').select('id, brand, branch, name')
            .eq('brand', profile.brand).eq('branch', cleanBranch).maybeSingle();
          if (est2) est = est2;
        }
        if (estError) {
          if (isActive) { setError(`Establishment error: ${estError.message}`); setLoading(false); }
          return;
        }
        if (est) {
          if (isActive) { setEstablishmentId(est.id); setError(null); }
        } else {
          if (isActive) { setError(`No establishment found for ${profile.brand} - ${profile.branch}`); setLoading(false); }
        }
      } catch (err: any) {
        if (isActive) { setError(err.message || 'Unknown error'); setLoading(false); }
      }
    };
    getEstablishmentId();
    return () => { isActive = false; };
  }, [staffId]);

  // Helper: notify other staff in same branch (excluding current)
  const notifyOtherStaff = useCallback(async (title: string, message: string, metadata: any, priority: 'high' | 'normal' = 'normal') => {
    if (!staffProfile) return;
    const { data: allStaff } = await supabase
      .from('profiles').select('id, name')
      .eq('brand', staffProfile.brand)
      .eq('branch', staffProfile.branch)
      .eq('role', 'staff');
    const others = allStaff?.filter((s: any) => s.id !== staffId) || [];
    for (const s of others) {
      await addNotification({
        user_id: s.id,
        title,
        message,
        type: 'queue',
        priority,
        metadata,
      });
    }
  }, [staffProfile, staffId, addNotification]);

  // Fetch staff data
  const fetchStaffData = useCallback(async () => {
    const currentFetch = ++fetchCount.current;
    if (!staffId || !establishmentId) {
      if (isMounted.current) { setLoading(false); setError('Missing staff or establishment ID'); }
      return;
    }
    if (isMounted.current) setLoading(true);
    try {
      const { data: estData, error: estErr } = await supabase
        .from('establishments').select('*').eq('id', establishmentId).single();
      if (estErr) throw new Error(`Establishment error: ${estErr.message}`);

      const { data: entries, error: entriesErr } = await supabase
        .from('queue_entries')
        .select(`*, user:profiles!queue_entries_user_id_fkey(id, name, email, role)`)
        .eq('establishment_id', establishmentId)
        .neq('status', 'cancelled')
        .order('ticket_number', { ascending: true });
      if (entriesErr) throw new Error(`Queue entries error: ${entriesErr.message}`);

      const waiting = entries?.filter((e: any) => e.status === 'waiting' && e.ticket_number > 0) || [];
      const serving = entries?.filter((e: any) => e.status === 'serving' && e.ticket_number > 0) || [];
      const served = entries?.filter((e: any) => e.status === 'completed' && e.ticket_number > 0) || [];
      const templates = (entries?.filter((e: any) => e.ticket_number === 0) || []).map((t: any) => {
        let notes: any = {};
        try { notes = t.notes ? JSON.parse(t.notes) : {}; } catch (err) {}
        return { ...t, metadata: notes };
      });
      const today = new Date().toISOString().split('T')[0];
      const todayServed = served.filter((e: any) => e.created_at?.startsWith(today)).length;

      if (isMounted.current && fetchCount.current === currentFetch) {
        setQueueData({
          waitingList: waiting as QueueEntry[],
          servingList: serving as QueueEntry[],
          servedList: served as QueueEntry[],
          stats: { totalWaiting: waiting.length, totalServing: serving.length, totalServed: served.length, todayServed },
          establishment: estData as Establishment,
          queueTemplates: templates,
        });
        setError(null);
      }
    } catch (err: any) {
      if (isMounted.current && fetchCount.current === currentFetch) {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      if (isMounted.current && fetchCount.current === currentFetch) setLoading(false);
    }
  }, [staffId, establishmentId]);

  // Create Queue (with notifications)
  const createQueue = useCallback(async (data: CreateQueueData) => {
    if (!establishmentId || !staffId) return { success: false, error: 'Missing establishment or staff' };
    setCreating(true);
    try {
      const { data: newQueue, error: insertError } = await supabase
        .from('queue_entries')
        .insert({
          user_id: staffId,
          establishment_id: establishmentId,
          ticket_number: 0,
          status: 'waiting',
          position: 0,
          priority: 0,
          party_size: 0,
          notes: JSON.stringify({
            type: 'queue',
            name: data.name,
            estimatedWait: data.estimatedWait || 15,
            capacity: data.capacity || 50,
            status: data.status || 'active',
            created_by: staffId,
            created_by_name: staffProfile?.name || 'Staff',
          }),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (insertError) return { success: false, error: insertError.message };

      // Notify creator
      await addNotification({
        user_id: staffId,
        title: 'Queue Created',
        message: `You created queue "${data.name}".`,
        type: 'queue',
        priority: 'high',
        metadata: { queue_id: newQueue.id, queue_name: data.name },
      });
      // Notify other staff
      await notifyOtherStaff(
        'Queue Created',
        `"${data.name}" queue was created by ${staffProfile?.name || 'Staff'}.`,
        { queue_id: newQueue.id, queue_name: data.name, created_by: staffId }
      );
      // Notify customers
      const { data: customers } = await supabase
        .from('profiles').select('id')
        .eq('brand', staffProfile?.brand)
        .eq('branch', staffProfile?.branch)
        .eq('role', 'customer');
      if (customers) {
        for (const c of customers) {
          await addNotification({
            user_id: c.id,
            title: 'New Queue Available',
            message: `"${data.name}" queue opened at ${queueData.establishment?.name || 'your branch'}.`,
            type: 'queue',
            priority: 'normal',
            metadata: { queue_id: newQueue.id, establishment_id: establishmentId },
          });
        }
      }
      await fetchStaffData();
      return { success: true, data: newQueue };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally { setCreating(false); }
  }, [establishmentId, staffId, staffProfile, fetchStaffData, queueData.establishment, addNotification, notifyOtherStaff]);

  // Serve next customer
  const serveNext = useCallback(async () => {
    if (!establishmentId) return false;
    if (processing) return false;
    setProcessing(true);
    try {
      const { data: next, error: findErr } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('establishment_id', establishmentId)
        .eq('status', 'waiting')
        .gt('ticket_number', 0)
        .order('ticket_number', { ascending: true })
        .limit(1)
        .single();
      if (findErr) {
        if (findErr.code === 'PGRST116') return false; // no rows
        throw findErr;
      }
      if (!next) return false;

      const { error: updateErr } = await supabase
        .from('queue_entries')
        .update({ status: 'serving', called_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', next.id);
      if (updateErr) throw updateErr;

      await supabase
        .from('establishments')
        .update({ next_serving: next.ticket_number + 1, last_served_at: new Date().toISOString() })
        .eq('id', establishmentId);

      await addNotification({
        user_id: next.user_id,
        title: 'Your turn!',
        message: `You're now being served at ${queueData.establishment?.name || 'our branch'}.`,
        type: 'serve',
        priority: 'high',
        metadata: { queue_id: next.id, ticket_number: next.ticket_number },
      });

      await fetchStaffData();
      return true;
    } catch (err) {
      console.log('serveNext error:', err);
      return false;
    } finally { setProcessing(false); }
  }, [establishmentId, processing, fetchStaffData, queueData.establishment, addNotification]);

  // Mark served
  const markServed = useCallback(async (entryId: string) => {
    if (!establishmentId || processing) return false;
    setProcessing(true);
    try {
      const { data: entry, error: entryErr } = await supabase
        .from('queue_entries').select('user_id, ticket_number').eq('id', entryId).single();
      if (entryErr) throw entryErr;

      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'completed', served_by: staffId, served_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', entryId);
      if (error) throw error;

      await supabase
        .from('establishments')
        .update({ current_queue: supabase.rpc('decrement', { x: 1 }), last_served_at: new Date().toISOString() })
        .eq('id', establishmentId);

      if (entry) {
        await addNotification({
          user_id: entry.user_id,
          title: 'Service Complete',
          message: `Thank you! Ticket #${entry.ticket_number} has been served.`,
          type: 'queue',
          priority: 'normal',
          metadata: { queue_id: entryId, ticket_number: entry.ticket_number },
        });
      }

      await fetchStaffData();
      return true;
    } catch (err) {
      console.log('markServed error:', err);
      return false;
    } finally { setProcessing(false); }
  }, [establishmentId, staffId, processing, fetchStaffData, addNotification]);

  // Cancel customer
  const cancelCustomer = useCallback(async (entryId: string) => {
    if (!establishmentId || processing) return false;
    setProcessing(true);
    try {
      const { data: entry, error: entryErr } = await supabase
        .from('queue_entries').select('user_id, ticket_number').eq('id', entryId).single();
      if (entryErr) throw entryErr;

      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', entryId);
      if (error) throw error;

      if (entry) {
        await addNotification({
          user_id: entry.user_id,
          title: 'Queue Cancelled',
          message: `Ticket #${entry.ticket_number} has been cancelled.`,
          type: 'queue',
          priority: 'normal',
          metadata: { queue_id: entryId, ticket_number: entry.ticket_number },
        });
      }

      await fetchStaffData();
      return true;
    } catch (err) {
      console.log('cancelCustomer error:', err);
      return false;
    } finally { setProcessing(false); }
  }, [establishmentId, processing, fetchStaffData, addNotification]);

  // Call customer again
  const callCustomer = useCallback(async (entryId: string) => {
    try {
      const { data: entry, error: findErr } = await supabase
        .from('queue_entries').select('user_id, ticket_number').eq('id', entryId).single();
      if (findErr || !entry) return false;

      await addNotification({
        user_id: entry.user_id,
        title: 'Customer Call',
        message: `Ticket #${entry.ticket_number} – please proceed to the counter.`,
        type: 'serve',
        priority: 'high',
        metadata: { queue_id: entryId, ticket_number: entry.ticket_number },
      });
      return true;
    } catch (err) {
      console.log('callCustomer error:', err);
      return false;
    }
  }, [addNotification]);

  // Update Queue (with notifications)
  const updateQueue = useCallback(async (queueId: string, updates: Partial<CreateQueueData>) => {
    if (!establishmentId || !staffId) return { success: false, error: 'Missing establishment or staff' };
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('queue_entries').select('notes').eq('id', queueId).single();
      if (fetchError) return { success: false, error: fetchError.message };

      let notes: any = {};
      try { notes = existing.notes ? JSON.parse(existing.notes) : {}; } catch {}
      const updatedNotes = {
        ...notes,
        name: updates.name ?? notes.name ?? '',
        estimatedWait: updates.estimatedWait ?? notes.estimatedWait ?? 15,
        capacity: updates.capacity ?? notes.capacity ?? 50,
        status: updates.status ?? notes.status ?? 'active',
        updated_at: new Date().toISOString(),
      };
      const { error: updateError } = await supabase
        .from('queue_entries')
        .update({ notes: JSON.stringify(updatedNotes), updated_at: new Date().toISOString() })
        .eq('id', queueId);
      if (updateError) return { success: false, error: updateError.message };

      const queueName = updatedNotes.name || 'Unnamed Queue';

      // Notify creator
      await addNotification({
        user_id: staffId,
        title: 'Queue Updated',
        message: `You updated queue "${queueName}".`,
        type: 'queue',
        priority: 'high',
        metadata: { queue_id: queueId, queue_name: queueName },
      });
      // Notify other staff
      await notifyOtherStaff(
        'Queue Updated',
        `"${queueName}" queue was updated by ${staffProfile?.name || 'Staff'}.`,
        { queue_id: queueId, queue_name: queueName, updated_by: staffId }
      );

      await fetchStaffData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [establishmentId, staffId, staffProfile, fetchStaffData, addNotification, notifyOtherStaff]);

  // Delete Queue (with notifications)
  const deleteQueue = useCallback(async (queueId: string) => {
    if (!establishmentId || !staffId) return { success: false, error: 'Missing establishment or staff' };
    try {
      // get name for notification
      const { data: queue, error: getErr } = await supabase
        .from('queue_entries').select('notes').eq('id', queueId).single();
      let queueName = 'Unknown Queue';
      if (queue?.notes) {
        try { const n = JSON.parse(queue.notes); queueName = n.name || queueName; } catch {}
      }

      const { error: deleteError } = await supabase
        .from('queue_entries').delete().eq('id', queueId);
      if (deleteError) return { success: false, error: deleteError.message };

      // Notify creator
      await addNotification({
        user_id: staffId,
        title: 'Queue Deleted',
        message: `You deleted queue "${queueName}".`,
        type: 'queue',
        priority: 'high',
        metadata: { queue_id: queueId, queue_name: queueName },
      });
      // Notify other staff
      await notifyOtherStaff(
        'Queue Deleted',
        `"${queueName}" queue was deleted by ${staffProfile?.name || 'Staff'}.`,
        { queue_id: queueId, queue_name: queueName, deleted_by: staffId }
      );

      await fetchStaffData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [establishmentId, staffId, staffProfile, fetchStaffData, addNotification, notifyOtherStaff]);

  // Get queues for My Queue tab
  const getQueues = useCallback(async () => {
    if (!establishmentId) return { success: false, error: 'Missing establishment', data: [] };
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`*, user:profiles!queue_entries_user_id_fkey(id, name, email, role)`)
        .eq('establishment_id', establishmentId)
        .eq('ticket_number', 0)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message, data: [] };
      const parsed = data.map((q: any) => {
        let notes: any = {};
        try { notes = q.notes ? JSON.parse(q.notes) : {}; } catch {}
        return { ...q, metadata: notes, creator_name: notes.created_by_name || q.user?.name || 'Unknown Staff' };
      });
      return { success: true, data: parsed };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] };
    }
  }, [establishmentId]);

  // Get single queue by ID
  const getQueueById = useCallback(async (queueId: string) => {
    if (!establishmentId) return { success: false, error: 'Missing establishment', data: null };
    try {
      const { data: queue, error } = await supabase
        .from('queue_entries')
        .select(`*, user:profiles!queue_entries_user_id_fkey(id, name, email, role)`)
        .eq('id', queueId).single();
      if (error) return { success: false, error: error.message, data: null };
      let notes = {};
      try { notes = queue.notes ? JSON.parse(queue.notes) : {}; } catch {}
      return { success: true, data: { ...queue, metadata: notes } };
    } catch (err: any) {
      return { success: false, error: err.message, data: null };
    }
  }, [establishmentId]);

  // Initial fetch + realtime
  useEffect(() => {
    if (staffId && establishmentId) fetchStaffData();
  }, [staffId, establishmentId, fetchStaffData]);

  useEffect(() => {
    if (!establishmentId) return;
    cleanupChannel();
    const channel = supabase
      .channel(`staff-queue-${establishmentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries', filter: `establishment_id=eq.${establishmentId}` }, () => {
        if (isMounted.current) fetchStaffData();
      })
      .subscribe();
    channelRef.current = channel;
    return () => { cleanupChannel(); };
  }, [establishmentId, fetchStaffData]);

  return {
    ...queueData,
    loading,
    creating,
    processing,
    error,
    serveNext,
    markServed,
    callCustomer,
    cancelCustomer,
    refresh: fetchStaffData,
    createQueue,
    updateQueue,
    deleteQueue,
    getQueues,
    getQueueById,
    staffId,
    staffProfile,
  };
}