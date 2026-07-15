import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Establishment, BrandType } from '../types';
import { BRAND } from '../lib/constants';

export function useEstablishments() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEstablishments = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('establishments')
      .select('*')
      .order('brand')
      .order('branch');
    if (err) setError(err.message);
    else setEstablishments((data as Establishment[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEstablishments();

    const channel = supabase
      .channel('est-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'establishments' },
        (p) => setEstablishments((prev) => [...prev, p.new as Establishment]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'establishments' },
        (p) => setEstablishments((prev) =>
          prev.map((e) => e.id === p.new.id ? (p.new as Establishment) : e)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'establishments' },
        (p) => setEstablishments((prev) => prev.filter((e) => e.id !== p.old.id)))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadEstablishments]);

  async function addEstablishment(input: {
    brand: BrandType; branch: string; address: string; avg_wait_mins: number;
  }) {
    const { error: err } = await supabase.from('establishments').insert({
      brand: input.brand,
      name: BRAND[input.brand].label,
      branch: input.branch,
      address: input.address,
      avg_wait_mins: input.avg_wait_mins,
      current_queue: 0,
      next_serving: 1,
      is_open: true,
    });
    if (err) throw new Error(err.message);
  }

  async function updateEstablishment(id: string, updates: Partial<Establishment>) {
    const { error: err } = await supabase
      .from('establishments').update(updates).eq('id', id);
    if (err) throw new Error(err.message);
  }

  async function deleteEstablishment(id: string) {
    const { error: err } = await supabase
      .from('establishments').delete().eq('id', id);
    if (err) throw new Error(err.message);
  }

  async function resetQueue(id: string) {
    await updateEstablishment(id, { current_queue: 0, next_serving: 1 });
  }

  async function toggleOpen(id: string, currentState: boolean) {
    await updateEstablishment(id, { is_open: !currentState });
  }

  const open = establishments.filter((e) => e.is_open);
  const totalInQueue = open.reduce((s, e) => s + (e.current_queue || 0), 0);
  const avgWait = open.length
    ? Math.round(open.reduce((s, e) => s + (e.avg_wait_mins || 5), 0) / open.length)
    : 0;

  return {
    establishments, open, totalInQueue, avgWait,
    loading, error, loadEstablishments,
    addEstablishment, updateEstablishment,
    deleteEstablishment, resetQueue, toggleOpen,
  };
}
