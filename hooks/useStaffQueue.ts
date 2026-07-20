import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QueueEntry, Establishment, Queue } from '../types';
import { useNotifications } from './useNotifications';

console.log('🏪 [useStaffQueue] Module loaded');

interface StaffQueueStats {
  totalWaiting: number;
  totalServing: number;
  totalServed: number;
  todayServed: number;
}

// ✅ Retry helper: waits and retries a function with exponential backoff
async function retryUntil<T>(
  fn: () => Promise<T | null>,
  maxRetries: number = 5,
  delayMs: number = 1000
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();
    if (result) return result;
    if (i < maxRetries - 1) {
      console.log(`🏪 [useStaffQueue] 🔄 Retry ${i + 1}/${maxRetries} — waiting ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 1.5; // Exponential backoff: 1s, 1.5s, 2.25s, 3.4s, 5s
    }
  }
  return null;
}

export function useStaffQueue(staffId: string | undefined) {
  console.log(`🏪 [useStaffQueue] 🎯 Hook called with staffId: ${staffId || 'undefined'}`);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [waitingList, setWaitingList] = useState<QueueEntry[]>([]);
  const [servingList, setServingList] = useState<QueueEntry[]>([]);
  const [servedList, setServedList] = useState<QueueEntry[]>([]);
  const [queueTemplates, setQueueTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<StaffQueueStats>({
    totalWaiting: 0,
    totalServing: 0,
    totalServed: 0,
    todayServed: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isMounted = useRef(true);
  const fetchCount = useRef(0);
  const activeScopeRef = useRef<{ staffId?: string; establishmentId?: string | null }>({});

  const { addNotification } = useNotifications(staffId);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('🏪 [useStaffQueue] 📡 Cleaning up channel');
      try { supabase.removeChannel(channelRef.current); } catch (err) {}
      channelRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setEstablishment(null);
    setEstablishmentId(null);
    setStaffProfile(null);
    setQueues([]);
    setWaitingList([]);
    setServingList([]);
    setServedList([]);
    setQueueTemplates([]);
    setStats({ totalWaiting: 0, totalServing: 0, totalServed: 0, todayServed: 0 });
    setError(null);
    setLoading(true);
  }, []);

  // Get staff profile and find establishment — WITH RETRY
  useEffect(() => {
    let isActive = true;
    activeScopeRef.current = { staffId, establishmentId: null };

    if (!staffId) {
      resetState();
      setLoading(false);
      setError('No staff ID provided');
      return;
    }

    resetState();

    const getEstablishmentId = async () => {
      try {
        setError(null);
        
        // Step 1: Get profile
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

        // ✅ Step 2: Look up establishment WITH RETRY
        // This handles the race condition where ensureEstablishment in useAuth
        // is still creating the establishment row
        console.log(`🏪 [useStaffQueue] 🔍 Looking up establishment for ${profile.brand} - ${profile.branch}`);
        
        const est = await retryUntil<Establishment>(
          async () => {
            const { data, error: estError } = await supabase
              .from('establishments')
              .select('*')
              .eq('brand', profile.brand)
              .eq('branch', profile.branch)
              .maybeSingle();
            
            if (estError) {
              console.log(`🏪 [useStaffQueue] ⚠️ Establishment lookup error: ${estError.message}`);
              return null;
            }
            return data as Establishment | null;
          },
          20,    // Max 20 retries
          400    // Start with 400ms delay, exponential backoff
        );

        if (!isActive) return;

        if (est) {
          console.log(`🏪 [useStaffQueue] ✅ Establishment found: ${est.id}`);
          setEstablishment(est);
          setEstablishmentId(est.id);
          activeScopeRef.current = { staffId, establishmentId: est.id };
          setError(null);
        } else {
          console.log(`🏪 [useStaffQueue] ❌ Establishment not found after retries`);
          if (isActive) { 
            setError(`No establishment found for ${profile.brand} - ${profile.branch}. Try restarting the app.`); 
            setLoading(false); 
          }
        }
      } catch (err: any) {
        if (isActive) { setError(err.message || 'Unknown error'); setLoading(false); }
      }
    };
    
    getEstablishmentId();
    return () => { isActive = false; };
  }, [staffId, resetState]);

  // Notify all staff in same branch
  const notifyStaffInBranch = useCallback(async (title: string, message: string, metadata: any) => {
    if (!staffProfile || !staffId) return;
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
        priority: 'high',
        metadata,
      });
    }
  }, [staffProfile, staffId, addNotification]);

  // Notify all customers in same branch
  const notifyCustomersInBranch = useCallback(async (title: string, message: string, metadata: any) => {
    if (!staffProfile) return;
    const { data: customers } = await supabase
      .from('profiles').select('id')
      .eq('brand', staffProfile.brand)
      .eq('branch', staffProfile.branch)
      .eq('role', 'customer');
    if (customers) {
      for (const c of customers) {
        await addNotification({
          user_id: c.id,
          title,
          message,
          type: 'queue',
          priority: 'normal',
          metadata,
        });
      }
    }
  }, [staffProfile, addNotification]);

  // Fetch staff data
  const fetchStaffData = useCallback(async () => {
    const currentFetch = ++fetchCount.current;
    const activeScope = activeScopeRef.current;

    if (!staffId || !activeScope.establishmentId) {
      if (isMounted.current) { setLoading(false); setError('Missing staff or establishment ID'); }
      return;
    }
    if (isMounted.current) setLoading(true);
    try {
      const { data: queuesData, error: queuesErr } = await supabase
        .from('queues')
        .select('*, created_by_profile:profiles!queues_created_by_fkey(name)')
        .eq('establishment_id', activeScope.establishmentId)
        .order('name');
      if (queuesErr) throw new Error(`Queues error: ${queuesErr.message}`);

      const queueIds = queuesData?.map((q: any) => q.id) || [];

      let entries: any[] = [];
      if (queueIds.length > 0) {
        const { data: entriesData, error: entriesErr } = await supabase
          .from('queue_entries')
          .select(`
            *,
            user:profiles!queue_entries_user_id_fkey(id, name, email, role),
            queue:queues!inner(id, name, created_by, created_by_profile:profiles!queues_created_by_fkey(name))
          `)
          .eq('establishment_id', activeScope.establishmentId)
          .in('queue_id', queueIds)
          .neq('status', 'cancelled')
          .order('ticket_number', { ascending: true });
        if (entriesErr) throw new Error(`Queue entries error: ${entriesErr.message}`);
        entries = entriesData || [];
      }

      const waiting = entries?.filter((e: any) => e.status === 'waiting' && e.ticket_number > 0) || [];
      const serving = entries?.filter((e: any) => e.status === 'serving' && e.ticket_number > 0) || [];
      const served = entries?.filter((e: any) => e.status === 'completed' && e.ticket_number > 0) || [];

      const mappedWaiting = waiting.map((e: any) => ({
        ...e,
        created_by_name: e.queue?.created_by_profile?.name || null,
      }));
      const mappedServing = serving.map((e: any) => ({
        ...e,
        created_by_name: e.queue?.created_by_profile?.name || null,
      }));
      const mappedServed = served.map((e: any) => ({
        ...e,
        created_by_name: e.queue?.created_by_profile?.name || null,
      }));

      const updatedQueues = (queuesData || []).map((q: any) => {
        const qWaiting = waiting.filter((e: any) => e.queue_id === q.id).length;
        const qServing = serving.filter((e: any) => e.queue_id === q.id).length;
        return {
          ...q,
          created_by_name: q.created_by_profile?.name || null,
          waitingCount: qWaiting,
          servingCount: qServing,
        };
      });

      const templates = (queuesData || []).map((q: any) => ({
        ...q,
        metadata: {
          name: q.name,
          estimatedWait: q.estimated_wait_mins || 15,
          capacity: q.capacity || 50,
          status: q.is_active ? 'active' : 'inactive',
        }
      }));

      const today = new Date().toISOString().split('T')[0];
      const todayServed = served.filter((e: any) => e.created_at?.startsWith(today)).length;

      if (isMounted.current && fetchCount.current === currentFetch) {
        setQueues(updatedQueues as Queue[]);
        setQueueTemplates(templates);
        setWaitingList(mappedWaiting as QueueEntry[]);
        setServingList(mappedServing as QueueEntry[]);
        setServedList(mappedServed as QueueEntry[]);
        setStats({
          totalWaiting: mappedWaiting.length,
          totalServing: mappedServing.length,
          totalServed: mappedServed.length,
          todayServed,
        });
        setError(null);
      }
    } catch (err: any) {
      if (isMounted.current && fetchCount.current === currentFetch) {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      if (isMounted.current && fetchCount.current === currentFetch) {
        setLoading(false);
      }
    }
  }, [staffId]);

  // CREATE QUEUE
  const createQueue = useCallback(async (data: { 
    name: string; 
    description?: string; 
    capacity?: number; 
    estimated_wait_mins?: number; 
  }) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    if (!activeEstablishmentId || !staffId) {
      return { success: false, error: 'Missing establishment or staff' };
    }
    
    setCreating(true);
    console.log(`🏪 [useStaffQueue] 🆕 Creating queue: ${data.name}`);
    
    try {
      const { data: newQueue, error: insertError } = await supabase
        .from('queues')
        .insert({
          establishment_id: activeEstablishmentId,
          name: data.name.trim(),
          description: data.description || null,
          capacity: data.capacity || 50,
          estimated_wait_mins: data.estimated_wait_mins || 15,
          is_active: true,
          created_by: staffId,
        })
        .select()
        .single();
      
      if (insertError) {
        return { success: false, error: insertError.message };
      }

      console.log(`🏪 [useStaffQueue] ✅ Queue created: ${newQueue.id}`);

      if (staffId) {
        await addNotification({
          user_id: staffId,
          title: '✅ Queue Created',
          message: `You created queue "${data.name}"`,
          type: 'queue',
          priority: 'high',
          metadata: { queue_id: newQueue.id, queue_name: data.name },
        });
      }

      await notifyStaffInBranch(
        '📋 New Queue Created',
        `${staffProfile?.name || 'Staff'} created "${data.name}" queue`,
        { queue_id: newQueue.id, queue_name: data.name, created_by: staffId }
      );

      await notifyCustomersInBranch(
        '📋 New Queue Available!',
        `"${data.name}" queue is now open at ${establishment?.name || 'your branch'}. Join now!`,
        { queue_id: newQueue.id, queue_name: data.name, establishment_id: activeEstablishmentId }
      );

      await fetchStaffData();
      return { success: true, data: newQueue };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally { 
      setCreating(false); 
    }
  }, [establishmentId, staffId, staffProfile, establishment, fetchStaffData, addNotification, notifyStaffInBranch, notifyCustomersInBranch]);

  // UPDATE QUEUE
  const updateQueue = useCallback(async (queueId: string, updates: any) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    if (!activeEstablishmentId) return { success: false, error: 'Missing establishment' };
    try {
      const { data: current } = await supabase
        .from('queues')
        .select('name')
        .eq('id', queueId)
        .eq('establishment_id', activeEstablishmentId)
        .single();

      const { error } = await supabase
        .from('queues')
        .update(updates)
        .eq('id', queueId)
        .eq('establishment_id', activeEstablishmentId);
      if (error) return { success: false, error: error.message };

      if (staffId) {
        await addNotification({
          user_id: staffId,
          title: '🔄 Queue Updated',
          message: `You updated queue "${current?.name || 'Unnamed'}"`,
          type: 'queue',
          priority: 'normal',
          metadata: { queue_id: queueId, queue_name: current?.name },
        });
      }

      await notifyStaffInBranch(
        '🔄 Queue Updated',
        `${staffProfile?.name || 'Staff'} updated "${current?.name || 'Unnamed'}" queue`,
        { queue_id: queueId, queue_name: current?.name }
      );

      const { data: customersInQueue } = await supabase
        .from('queue_entries')
        .select('user_id')
        .eq('queue_id', queueId)
        .eq('establishment_id', activeEstablishmentId)
        .in('status', ['waiting', 'serving']);

      if (customersInQueue) {
        for (const entry of customersInQueue) {
          await addNotification({
            user_id: entry.user_id,
            title: '🔄 Queue Updated',
            message: `"${current?.name || 'Queue'}" has been updated by staff`,
            type: 'queue',
            priority: 'normal',
            metadata: { queue_id: queueId },
          });
        }
      }

      await fetchStaffData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [establishmentId, staffId, staffProfile, fetchStaffData, addNotification, notifyStaffInBranch]);

  // DELETE QUEUE
  const deleteQueue = useCallback(async (queueId: string) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    if (!activeEstablishmentId) return { success: false, error: 'Missing establishment' };
    try {
      const { data: current } = await supabase
        .from('queues')
        .select('name')
        .eq('id', queueId)
        .eq('establishment_id', activeEstablishmentId)
        .single();

      const queueName = current?.name || 'Unnamed Queue';

      const { data: waitingCustomers } = await supabase
        .from('queue_entries')
        .select('id, user_id')
        .eq('queue_id', queueId)
        .eq('establishment_id', activeEstablishmentId)
        .eq('status', 'waiting');

      if (waitingCustomers && waitingCustomers.length > 0) {
        return { success: false, error: 'Cannot delete queue with waiting customers' };
      }

      const { error } = await supabase
        .from('queues')
        .delete()
        .eq('id', queueId)
        .eq('establishment_id', activeEstablishmentId);
      if (error) return { success: false, error: error.message };

      if (staffId) {
        await addNotification({
          user_id: staffId,
          title: '🗑️ Queue Deleted',
          message: `You deleted queue "${queueName}"`,
          type: 'queue',
          priority: 'high',
          metadata: { queue_id: queueId, queue_name: queueName },
        });
      }

      await notifyStaffInBranch(
        '🗑️ Queue Deleted',
        `${staffProfile?.name || 'Staff'} deleted "${queueName}" queue`,
        { queue_id: queueId, queue_name: queueName }
      );

      await notifyCustomersInBranch(
        '🚫 Queue Closed',
        `"${queueName}" queue has been closed`,
        { queue_id: queueId, queue_name: queueName }
      );

      await fetchStaffData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [establishmentId, staffId, staffProfile, fetchStaffData, addNotification, notifyStaffInBranch, notifyCustomersInBranch]);

  // SERVE NEXT
  const serveNext = useCallback(async (queueId?: string) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    if (!activeEstablishmentId) return false;
    if (processing) return false;
    setProcessing(true);
    try {
      let query = supabase
        .from('queue_entries')
        .select('*')
        .eq('establishment_id', activeEstablishmentId)
        .eq('status', 'waiting')
        .gt('ticket_number', 0);
      
      if (queueId) {
        query = query.eq('queue_id', queueId);
      }
      
      const { data: next, error: findErr } = await query
        .order('ticket_number', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (findErr) {
        if (findErr.code === 'PGRST116') return false;
        throw findErr;
      }
      if (!next) return false;

      const { error: updateErr } = await supabase
        .from('queue_entries')
        .update({ status: 'serving', called_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', next.id)
        .eq('establishment_id', activeEstablishmentId);
      if (updateErr) throw updateErr;

      if (next.user_id) {
        await addNotification({
          user_id: next.user_id,
          title: '🔔 Your Turn!',
          message: `You're now being served at ${establishment?.name || 'our branch'}. Please proceed to the counter.`,
          type: 'serve',
          priority: 'high',
          metadata: { queue_id: next.queue_id, ticket_number: next.ticket_number },
        });
      }

      await notifyStaffInBranch(
        '🔔 Customer Called',
        `Ticket #${next.ticket_number} is now being served`,
        { entry_id: next.id, ticket_number: next.ticket_number }
      );

      await fetchStaffData();
      return true;
    } catch (err) {
      console.log('serveNext error:', err);
      return false;
    } finally { setProcessing(false); }
  }, [establishmentId, processing, fetchStaffData, establishment, addNotification, notifyStaffInBranch]);

  // MARK SERVED
  const markServed = useCallback(async (entryId: string) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    if (!activeEstablishmentId || processing) return false;
    setProcessing(true);
    try {
      const { data: entry, error: entryErr } = await supabase
        .from('queue_entries').select('user_id, ticket_number, queue_id, status').eq('id', entryId).eq('establishment_id', activeEstablishmentId).single();
      if (entryErr) throw entryErr;
      
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'completed', 
          served_by: staffId, 
          served_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        })
        .eq('id', entryId)
        .eq('establishment_id', activeEstablishmentId);
      if (error) throw error;
      
      if (entry && entry.user_id) {
        await addNotification({
          user_id: entry.user_id,
          title: '✅ Service Complete',
          message: `Thank you! Ticket #${entry.ticket_number} has been served.`,
          type: 'serve',
          priority: 'normal',
          metadata: { queue_id: entry.queue_id, ticket_number: entry.ticket_number },
        });
      }

      await notifyStaffInBranch(
        '✅ Customer Served',
        `Ticket #${entry.ticket_number} marked as completed`,
        { entry_id: entryId, ticket_number: entry.ticket_number }
      );

      await fetchStaffData();
      return true;
    } catch (err) {
      console.log('markServed error:', err);
      return false;
    } finally { setProcessing(false); }
  }, [establishmentId, staffId, processing, fetchStaffData, addNotification, notifyStaffInBranch]);

  // CANCEL CUSTOMER
  const cancelCustomer = useCallback(async (entryId: string) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    if (!activeEstablishmentId || processing) return false;
    setProcessing(true);
    try {
      const { data: entry, error: entryErr } = await supabase
        .from('queue_entries').select('user_id, ticket_number').eq('id', entryId).eq('establishment_id', activeEstablishmentId).single();
      if (entryErr) throw entryErr;
      
      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', entryId)
        .eq('establishment_id', activeEstablishmentId);
      if (error) throw error;
      
      if (entry && entry.user_id) {
        await addNotification({
          user_id: entry.user_id,
          title: '❌ Queue Cancelled',
          message: `Ticket #${entry.ticket_number} has been cancelled by staff.`,
          type: 'queue',
          priority: 'high',
          metadata: { ticket_number: entry.ticket_number },
        });
      }

      await notifyStaffInBranch(
        '❌ Customer Cancelled',
        `Ticket #${entry.ticket_number} cancelled`,
        { entry_id: entryId }
      );

      await fetchStaffData();
      return true;
    } catch (err) {
      console.log('cancelCustomer error:', err);
      return false;
    } finally { setProcessing(false); }
  }, [establishmentId, processing, fetchStaffData, addNotification, notifyStaffInBranch]);

  // CALL CUSTOMER
  const callCustomer = useCallback(async (entryId: string) => {
    const activeEstablishmentId = activeScopeRef.current.establishmentId || establishmentId;
    try {
      const { data: entry, error: findErr } = await supabase
        .from('queue_entries').select('user_id, ticket_number').eq('id', entryId).eq('establishment_id', activeEstablishmentId).single();
      if (findErr || !entry) return false;
      
      if (entry.user_id) {
        await addNotification({
          user_id: entry.user_id,
          title: '📢 Customer Call',
          message: `Ticket #${entry.ticket_number} – please proceed to the counter.`,
          type: 'serve',
          priority: 'high',
          metadata: { queue_id: entryId, ticket_number: entry.ticket_number },
        });
      }
      return true;
    } catch (err) {
      console.log('callCustomer error:', err);
      return false;
    }
  }, [addNotification]);

  // Get queues
  const getQueues = useCallback(async () => {
    if (!establishmentId) return { success: false, error: 'Missing establishment', data: [] };
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('name');
      if (error) return { success: false, error: error.message, data: [] };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] };
    }
  }, [establishmentId]);

  // Get single queue
  const getQueueById = useCallback(async (queueId: string) => {
    if (!establishmentId) return { success: false, error: 'Missing establishment', data: null };
    try {
      const { data: queue, error } = await supabase
        .from('queues')
        .select('*')
        .eq('id', queueId)
        .eq('establishment_id', establishmentId)
        .single();
      if (error) return { success: false, error: error.message, data: null };
      return { success: true, data: queue };
    } catch (err: any) {
      return { success: false, error: err.message, data: null };
    }
  }, [establishmentId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!establishmentId) return;
    cleanupChannel();
    
    const channel = supabase
      .channel(`staff-queue-${establishmentId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queues', 
        filter: `establishment_id=eq.${establishmentId}` 
      }, () => {
        if (isMounted.current) fetchStaffData();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue_entries',
        filter: `establishment_id=eq.${establishmentId}`
      }, () => {
        if (isMounted.current) fetchStaffData();
      })
      .subscribe();
    
    channelRef.current = channel;
    return () => { cleanupChannel(); };
  }, [establishmentId, fetchStaffData, cleanupChannel]);

  // Initial fetch
  useEffect(() => {
    if (staffId && establishmentId) {
      console.log(`🏪 [useStaffQueue] 🔄 Initial fetch for staff: ${staffId}`);
      fetchStaffData();
    }
  }, [staffId, establishmentId, fetchStaffData]);

  return {
    queues,
    waitingList,
    servingList,
    servedList,
    queueTemplates,
    stats,
    establishment,
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