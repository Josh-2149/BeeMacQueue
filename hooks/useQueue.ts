import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QueueEntry } from '../types';

console.log('🎫 [useQueue] Module loaded');

export function useQueue(userId: string | undefined) {
  console.log(`🎫 [useQueue] Hook called with userId: ${userId || 'undefined'}`);
  
  const [activeQueue, setActiveQueue] = useState<QueueEntry | null>(null);
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isMounted = useRef(true);

  const fetchActive = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      console.log(`🎫 [useQueue] 🔍 Fetching active queue for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          establishment:establishments(*)
        `)
        .eq('user_id', userId)
        .in('status', ['waiting', 'called', 'serving'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('🎫 [useQueue] ❌ Fetch error:', error.message);
        return;
      }

      if (data && data.length > 0) {
        console.log(`🎫 [useQueue] ✅ Active queue found: #${data[0].ticket_number}`);
        setActiveQueue(data[0] as QueueEntry);
        setEstablishmentId(data[0].establishment_id);
      } else {
        console.log('🎫 [useQueue] ℹ️ No active queue');
        setActiveQueue(null);
        setEstablishmentId(null);
      }
    } catch (err) {
      console.log('🎫 [useQueue] ❌ Exception:', err);
    }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    try {
      console.log(`🎫 [useQueue] 📜 Fetching history for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          establishment:establishments(*)
        `)
        .eq('user_id', userId)
        .in('status', ['completed', 'cancelled', 'no_show'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.log('🎫 [useQueue] ❌ History error:', error.message);
        return;
      }

      console.log(`🎫 [useQueue] 📜 History found: ${data?.length || 0} entries`);
      setHistory(data as QueueEntry[] || []);
    } catch (err) {
      console.log('🎫 [useQueue] ❌ History exception:', err);
    }
  }, [userId]);

  const joinQueue = useCallback(async (estId: string): Promise<number> => {
    if (!userId) {
      console.log('🎫 [useQueue] ❌ No user ID');
      throw new Error('Please login first');
    }

    if (activeQueue) {
      console.log('🎫 [useQueue] ❌ Already in a queue');
      throw new Error('You are already in a queue');
    }

    setJoining(true);
    try {
      console.log(`🎫 [useQueue] 🎯 Joining queue: ${estId}`);

      const [userProfile, est] = await Promise.all([
        supabase.from('profiles').select('name, brand, branch').eq('id', userId).single(),
        supabase.from('establishments').select('*').eq('id', estId).single()
      ]);

      if (est.error) {
        console.log('🎫 [useQueue] ❌ Establishment error:', est.error.message);
        throw new Error('Could not fetch queue status');
      }

      const ticketNumber = est.data.next_serving || 1;
      console.log(`🎫 [useQueue] 📝 Ticket #${ticketNumber}`);

      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          user_id: userId,
          establishment_id: estId,
          ticket_number: ticketNumber,
          status: 'waiting',
          position: est.data.current_queue + 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.log('🎫 [useQueue] ❌ Insert error:', error.message);
        throw new Error(error.message);
      }

      console.log(`🎫 [useQueue] ✅ Queue entry created: ${data.id}`);

      await supabase
        .from('establishments')
        .update({
          current_queue: est.data.current_queue + 1,
          next_serving: ticketNumber + 1,
        })
        .eq('id', estId);

      // ✅ NOTIFICATION 1: Customer notification
      console.log(`🎫 [useQueue] 📢 Sending 'Joined Queue' notification to customer: ${userId}`);
      
      const notifResult = await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎫 Joined Queue!',
        message: `You joined the queue at ${est.data.name}. Ticket #${ticketNumber}. ${est.data.current_queue + 1} people ahead.`,
        type: 'queue',
        priority: 'high',
        metadata: {
          queue_id: data.id,
          ticket_number: ticketNumber,
          establishment_id: estId,
          position: est.data.current_queue + 1,
          joined_at: new Date().toISOString(),
        }
      });

      if (notifResult.error) {
        console.log('🎫 [useQueue] ❌ Customer notification error:', notifResult.error.message);
      } else {
        console.log('🎫 [useQueue] ✅ Customer notification sent');
      }

      // ✅ NOTIFICATION 2: Notify ALL staff at this establishment
      console.log(`🎫 [useQueue] 📢 Fetching staff for brand: ${est.data.brand}, branch: ${est.data.branch}`);
      
      const { data: staffList, error: staffError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('brand', est.data.brand)
        .eq('branch', est.data.branch)
        .eq('role', 'staff');

      if (staffError) {
        console.log('🎫 [useQueue] ❌ Staff query error:', staffError.message);
      }

      if (staffList && staffList.length > 0) {
        console.log(`🎫 [useQueue] 📢 Notifying ${staffList.length} staff members`);
        
        let staffNotifCount = 0;
        for (const staff of staffList) {
          console.log(`🎫 [useQueue] 📢 Sending to staff: ${staff.id} (${staff.name})`);
          
          const result = await supabase.from('notifications').insert({
            user_id: staff.id,
            title: '🎫 New Customer Joined!',
            message: `${userProfile.data?.name || 'A customer'} joined the queue. Ticket #${ticketNumber} at ${est.data.name}`,
            type: 'queue',
            priority: 'normal',
            metadata: {
              queue_id: data.id,
              ticket_number: ticketNumber,
              establishment_id: estId,
              customer_id: userId,
              customer_name: userProfile.data?.name || 'Customer',
              joined_at: new Date().toISOString(),
            }
          });

          if (result.error) {
            console.log(`🎫 [useQueue] ❌ Staff ${staff.id} notification error:`, result.error.message);
          } else {
            console.log(`🎫 [useQueue] ✅ Staff ${staff.id} notification sent`);
            staffNotifCount++;
          }
        }
        console.log(`🎫 [useQueue] 📊 Sent to ${staffNotifCount} staff members`);
      } else {
        console.log('🎫 [useQueue] ⚠️ No staff found to notify');
      }

      console.log(`🎫 [useQueue] ✅ Successfully joined queue: #${ticketNumber}`);
      await fetchActive();
      return ticketNumber;
    } catch (err: any) {
      console.log('🎫 [useQueue] ❌ Join error:', err);
      throw err;
    } finally {
      setJoining(false);
    }
  }, [userId, activeQueue, fetchActive]);

  const leaveQueue = useCallback(async () => {
    if (!activeQueue) {
      console.log('🎫 [useQueue] ⚠️ No active queue');
      return;
    }

    try {
      console.log(`🎫 [useQueue] 🚪 Leaving queue: #${activeQueue.ticket_number}`);
      
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeQueue.id);

      if (error) {
        console.log('🎫 [useQueue] ❌ Leave error:', error.message);
        throw new Error(error.message);
      }

      await supabase
        .from('establishments')
        .update({ 
          current_queue: supabase.rpc('decrement', { x: 1 })
        })
        .eq('id', activeQueue.establishment_id);

      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Left Queue',
        message: 'You have left the queue.',
        type: 'queue',
        priority: 'normal',
      });

      console.log('🎫 [useQueue] ✅ Left queue successfully');
      setActiveQueue(null);
      await fetchHistory();
    } catch (err) {
      console.log('🎫 [useQueue] ❌ Leave error:', err);
      throw err;
    }
  }, [activeQueue, userId, fetchHistory]);

  const refreshActive = useCallback(async () => {
    await fetchActive();
    await fetchHistory();
  }, [fetchActive, fetchHistory]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      console.log('🎫 [useQueue] 🚀 Initial load');
      Promise.all([fetchActive(), fetchHistory()]).finally(() => {
        if (isMounted.current) setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [userId, fetchActive, fetchHistory]);

  // Real-time subscription for active queue
  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`🎫 [useQueue] 📡 Setting up realtime for user: ${userId}`);

    const channel = supabase
      .channel(`queue-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_entries',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMounted.current) return;
          // ✅ FIXED: Safely access payload
          let recordId = 'unknown';
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            recordId = (payload.new as any).id;
          } else if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            recordId = (payload.old as any).id;
          }
          console.log(`🎫 [useQueue] 📡 Queue update received: ${payload.eventType} - ${recordId}`);
          fetchActive();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchActive]);

  return {
    activeQueue,
    history,
    loading,
    joining,
    joinQueue,
    leaveQueue,
    refreshActive,
  };
}