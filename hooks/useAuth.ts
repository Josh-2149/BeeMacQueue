// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

console.log('🔐 [useAuth] Module loaded');

export function useAuth() {
  console.log('🔐 [useAuth] Hook called');
  
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const ensureProfile = async (userId: string, email: string): Promise<Profile | null> => {
    // First check if profile exists
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.log('🔐 [useAuth] Profile check error:', error.message);
      return null;
    }

    // If profile exists, return it immediately - DON'T create a new one
    if (data) {
      console.log(`🔐 [useAuth] Profile already exists: role=${data.role}`);
      return data as Profile;
    }

    // Only create if NO profile exists (first time login)
    console.log('🔐 [useAuth] No profile found, creating one with role=customer');
    const newProfile: Profile = {
      id: userId,
      name: email.split('@')[0] || 'User',
      email: email,
      role: 'customer',
      brand: undefined,
      branch: undefined,
      queues_joined: 0,
      created_at: new Date().toISOString(),
      avatar_url: undefined,
      phone_number: undefined,
      staff_id: undefined,
    };
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile);
    if (insertError) {
      console.log('🔐 [useAuth] Failed to create profile:', insertError.message);
      return null;
    }
    return newProfile;
  };

  useEffect(() => {
    console.log('🔐 [useAuth] useEffect START');
    let isMounted = true;
    
    const loadData = async () => {
      try {
        console.log('🔐 [useAuth] Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log('🔐 [useAuth] Session error:', error.message);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        console.log('🔐 [useAuth] Session:', session ? `✅ Active (${session.user?.email})` : '❌ None');
        if (isMounted) {
          setSession(session);
          setUser(session?.user || null);
          if (session?.user) {
            console.log(`🔐 [useAuth] User found: ${session.user.email}`);
            const profileData = await ensureProfile(session.user.id, session.user.email!);
            setProfile(profileData);
            console.log(`🔐 [useAuth] Profile loaded: role=${profileData?.role || 'none'}`);
          } else {
            setProfile(null);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (err) {
        console.log('🔐 [useAuth] Load error:', err);
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`🔐 [useAuth] Auth event: ${event}`);
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
          return;
        }
        if (newSession?.user) {
          const profileData = await ensureProfile(newSession.user.id, newSession.user.email!);
          setProfile(profileData);
          console.log(`🔐 [useAuth] Profile updated: role=${profileData?.role || 'none'}`);
        } else {
          setProfile(null);
        }
        setLoading(false);
        setInitialized(true);
      }
    );

    return () => {
      console.log('🔐 [useAuth] Cleaning up');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log(`🔐 [useAuth] 🔑 Sign in attempt: ${email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        console.log('🔐 [useAuth] ❌ Sign in error:', error.message);
        return { success: false, error: error.message };
      }
      console.log(`🔐 [useAuth] ✅ Sign in success: ${data.user?.email}`);
      return { success: true };
    } catch (err) {
      console.log('🔐 [useAuth] ❌ Sign in exception:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string, brand?: string, branch?: string) => {
    console.log(`🔐 [useAuth] 📝 Sign up attempt: ${email}, role: ${role}`);
    if (role === 'staff' && (!brand || !branch)) {
      return { success: false, error: 'Brand and branch required for staff' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { 
            name: name.trim(), 
            role, 
            brand: role === 'staff' ? brand : undefined, 
            branch: role === 'staff' ? branch : undefined 
          } 
        }
      });
      if (error) {
        console.log('🔐 [useAuth] ❌ Sign up error:', error.message);
        return { success: false, error: error.message };
      }
      if (!data.user) {
        return { success: false, error: 'No user created' };
      }
      const profileData: Profile = {
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
        role: role as 'customer' | 'staff',
        brand: role === 'staff' ? brand : undefined,
        branch: role === 'staff' ? branch : undefined,
        queues_joined: 0,
        created_at: new Date().toISOString(),
        avatar_url: undefined,
        phone_number: undefined,
        staff_id: undefined,
      };
      const { error: pe } = await supabase.from('profiles').insert(profileData);
      if (pe) {
        console.log('🔐 [useAuth] ❌ Profile error:', pe.message);
        const { error: upsertError } = await supabase.from('profiles').upsert(profileData);
        if (upsertError) {
          return { success: false, error: upsertError.message };
        }
      }
      console.log(`🔐 [useAuth] ✅ Profile created with role: ${role}`);
      return { success: true };
    } catch (err) {
      console.log('🔐 [useAuth] ❌ Sign up exception:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    console.log('🔐 [useAuth] 🚪 Signing out');
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      setUser(null);
      console.log('🔐 [useAuth] ✅ Signed out');
      return { success: true };
    } catch (err) {
      console.log('🔐 [useAuth] ❌ Sign out error:', err);
      return { success: false };
    }
  };

  const refreshProfile = async () => {
    if (!session?.user) return;
    console.log('🔐 [useAuth] 🔄 Refreshing profile...');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error) {
      console.log('🔐 [useAuth] ❌ Refresh error:', error.message);
    } else {
      setProfile(data as Profile || null);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user) return { success: false, error: 'Not logged in' };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);
      if (error) return { success: false, error: error.message };
      await refreshProfile();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { 
    session, 
    user,
    profile, 
    loading, 
    initialized,
    signIn, 
    signUp, 
    signOut,
    refreshProfile,
    updateProfile,
    updatePassword,
  };
}