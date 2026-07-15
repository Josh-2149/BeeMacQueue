import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData?.user?.user_metadata ?? {};
      const newProfile = {
        id: userId,
        name: meta.full_name ?? meta.name ?? userData?.user?.email?.split('@')[0] ?? 'User',
        email: userData?.user?.email ?? '',
        role: 'customer' as const,
        queues_joined: 0,
      };
      await supabase.from('profiles').upsert(newProfile);
      setProfile(newProfile as Profile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  async function signInEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  async function signUpEmail(
    email: string, password: string,
    name: string, role: 'customer' | 'admin'
  ) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name, role } },
    });
    if (error) return false;
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id, name, email, role, queues_joined: 0,
      });
    }
    return true;
  }

  async function updateProfile(updates: Partial<Pick<Profile, 'name'>>) {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) return false;
    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
    return true;
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'beemacqueue://auth/reset',
    });
    return !error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return {
    session, user, profile, loading,
    signInEmail, signUpEmail, signOut,
    updateProfile, updatePassword, resetPassword,
  };
}
