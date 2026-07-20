import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Queue, Establishment, BrandType } from '../types';

export interface QueueGroup {
  establishmentId: string;
  brand: BrandType;
  name: string;
  branch: string;
  queues: (Queue & { establishment: Establishment; waitingCount: number; servingCount: number; isFull: boolean })[];
}

type CustomerQueue = Queue & { establishment: Establishment; waitingCount: number; servingCount: number; isFull: boolean };

export function useCustomerQueues(brandFilter?: string, branchFilter?: string) {
  const [queues, setQueues] = useState<CustomerQueue[]>([]);
  const [groupedQueues, setGroupedQueues] = useState<QueueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupQueuesByBranch = (queueList: CustomerQueue[]) => {
    const groups: Record<string, QueueGroup> = {};

    queueList.forEach((queue) => {
      const est = queue.establishment;
      if (!est) return;

      const key = `${est.id}`;
      if (!groups[key]) {
        groups[key] = {
          establishmentId: est.id,
          brand: est.brand,
          name: est.name,
          branch: est.branch,
          queues: [],
        };
      }
      groups[key].queues.push(queue);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
      return a.branch.localeCompare(b.branch);
    });
  };

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ FIXED: Build query with optional brand/branch filters
      let queuesQuery = supabase
        .from('queues')
        .select(`
          *,
          establishment:establishments(*),
          created_by_profile:profiles!queues_created_by_fkey(name)
        `)
        .eq('is_active', true)
        .order('name');

      // Apply brand filter if provided
      if (brandFilter) {
        // We need to filter via the joined establishment
        // Supabase supports filtering on joined tables with the !inner syntax
        queuesQuery = supabase
          .from('queues')
          .select(`
            *,
            establishment:establishments!inner(*),
            created_by_profile:profiles!queues_created_by_fkey(name)
          `)
          .eq('is_active', true)
          .eq('establishment.brand', brandFilter)
          .order('name');
      }

      // Apply branch filter if provided
      if (branchFilter) {
        queuesQuery = supabase
          .from('queues')
          .select(`
            *,
            establishment:establishments!inner(*),
            created_by_profile:profiles!queues_created_by_fkey(name)
          `)
          .eq('is_active', true)
          .eq('establishment.branch', branchFilter)
          .order('name');
      }

      // Apply both filters if both provided
      if (brandFilter && branchFilter) {
        queuesQuery = supabase
          .from('queues')
          .select(`
            *,
            establishment:establishments!inner(*),
            created_by_profile:profiles!queues_created_by_fkey(name)
          `)
          .eq('is_active', true)
          .eq('establishment.brand', brandFilter)
          .eq('establishment.branch', branchFilter)
          .order('name');
      }

      const { data: queuesData, error: qErr } = await queuesQuery;

      if (qErr) throw new Error(qErr.message);

      const queueIds = queuesData?.map((q: any) => q.id) || [];
      let waitingMap: Record<string, number> = {};
      let servingMap: Record<string, number> = {};

      if (queueIds.length > 0) {
        const { data: entries, error: eErr } = await supabase
          .from('queue_entries')
          .select('queue_id, status')
          .in('queue_id', queueIds)
          .in('status', ['waiting', 'serving']);

        if (!eErr && entries) {
          entries.forEach((e: any) => {
            if (e.status === 'waiting') {
              waitingMap[e.queue_id] = (waitingMap[e.queue_id] || 0) + 1;
            } else if (e.status === 'serving') {
              servingMap[e.queue_id] = (servingMap[e.queue_id] || 0) + 1;
            }
          });
        }
      }

      const result = (queuesData || []).map((q: any) => {
        const waitingCount = waitingMap[q.id] || 0;
        const servingCount = servingMap[q.id] || 0;
        const totalActive = waitingCount + servingCount;
        const capacity = q.capacity || 50;
        const isFull = totalActive >= capacity;

        return {
          ...q,
          created_by_name: q.created_by_profile?.name || null,
          waitingCount,
          servingCount,
          isFull,
          establishment: q.establishment as Establishment,
        };
      });

      setQueues(result);
      setGroupedQueues(groupQueuesByBranch(result));
      setError(null);
    } catch (err: any) {
      console.error('Error fetching queues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandFilter, branchFilter]);

  useEffect(() => {
    fetchQueues();

    // ✅ FIXED: Realtime subscription now respects the same filters
    const channel = supabase
      .channel('customer-queues-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queues' },
        () => fetchQueues()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => fetchQueues()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQueues]);

  return {
    queues,
    groupedQueues,
    loading,
    error,
    refresh: fetchQueues,
  };
}