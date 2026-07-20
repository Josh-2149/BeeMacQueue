// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

console.log('🔐 [useAuth] Module loaded');

export function useAuth() {
  console.log('🔐 [useAuth] Hook called');
  
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ✅ DYNAMIC: Auto-create establishment if it doesn't exist
  const ensureEstablishment = async (brand: string, branch: string, userId: string): Promise<boolean> => {
    const normalizedBrand = (brand || '').trim().toLowerCase();
    const normalizedBranch = (branch || '').trim();

    if (!normalizedBrand || !normalizedBranch) {
      console.log('🔐 [useAuth] ⚠️ Skipping establishment creation because brand or branch is missing');
      return false;
    }

    const { data: existing } = await supabase
      .from('establishments')
      .select('id')
      .eq('brand', normalizedBrand)
      .eq('branch', normalizedBranch)
      .maybeSingle();

    if (existing) {
      console.log(`🔐 [useAuth] 🏢 Establishment already exists: ${normalizedBrand} - ${normalizedBranch}`);
      return true;
    }

    const brandNames: Record<string, string> = {
      jollibee: 'Jollibee',
      mcdo: "McDonald's",
      kfc: 'KFC',
      chowking: 'Chowking',
      mang_inasal: 'Mang Inasal',
    };

    const deriveDisplayName = (inputBrand: string): string => {
      const match = brandNames[inputBrand.toLowerCase()];
      if (match) return match;
      return inputBrand
        .trim()
        .replace(/[_-]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    };

    const displayName = deriveDisplayName(brand);

    console.log(`🔐 [useAuth] 🏢 Creating establishment: ${displayName} - ${normalizedBranch}`);
    const { error } = await supabase
      .from('establishments')
      .insert({
        brand: normalizedBrand,
        name: displayName,
        branch: normalizedBranch,
        created_by: userId,
      });

    if (error) {
      console.log('🔐 [useAuth] ⚠️ Failed to create establishment:', error.message);
      return false;
    }
    
    console.log('🔐 [useAuth] ✅ Establishment auto-created successfully');
    return true;
  };

  const ensureProfile = async (userId: string, email: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.log('🔐 [useAuth] Profile check error:', error.message);
      return null;
    }

    if (data) {
      console.log(`🔐 [useAuth] Profile already exists: role=${data.role}`);
      if (data.role === 'staff' && data.brand && data.branch) {
        await ensureEstablishment(data.brand, data.branch, data.id);
      }
      return data as Profile;
    }

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
    if (!user || profile?.role !== 'staff') return;

    const updateLastActive = () => {
      supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', user.id).then(() => {});
    };

    updateLastActive();

    const interval = setInterval(updateLastActive, 60000);
    return () => clearInterval(interval);
  }, [user?.id, profile?.role]);

  useEffect(() => {
    console.log('🔐 [useAuth] useEffect START');
    let isMounted = true;
    
    const loadData = async () => {
      try {
        console.log('🔐 [useAuth] Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.log('🔐 [useAuth] Session error:', error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        console.log('🔐 [useAuth] Session:', session ? `✅ Active (${session.user?.email})` : '❌ None');
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          console.log(`🔐 [useAuth] User found: ${session.user.email}`);
          const profileData = await ensureProfile(session.user.id, session.user.email!);
          if (!isMounted) return;
          setProfile(profileData);
          console.log(`🔐 [useAuth] Profile loaded: role=${profileData?.role || 'none'}`);
        } else {
          setProfile(null);
        }

        setLoading(false);
        setInitialized(true);
      } catch (err) {
        console.log('🔐 [useAuth] Load error:', err);
        if (!isMounted) return;
        setLoading(false);
        setInitialized(true);
      }
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`🔐 [useAuth] Auth event: ${event}`);
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          const profileData = await ensureProfile(newSession.user.id, newSession.user.email!);
          if (!isMounted) return;
          setProfile(profileData);
          console.log(`🔐 [useAuth] Profile updated: role=${profileData?.role || 'none'}`);
        } else {
          setProfile(null);
        }

        if (!isMounted) return;
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

      // ✅ STEP 1: Create establishment FIRST and WAIT for it
      if (role === 'staff' && brand && branch) {
        const estCreated = await ensureEstablishment(brand, branch, data.user.id);
        if (!estCreated) {
          console.log('🔐 [useAuth] ⚠️ Establishment creation failed, but continuing...');
        }
      }

      // ✅ STEP 2: Create profile
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

      // ✅ STEP 3: Immediately set profile so _layout.tsx sees the correct role
      // This prevents the customer POV flash and ensures StaffQueueProvider gets the right data
      setProfile(profileData);
      setSession(data.session);
      setUser(data.user);
      setLoading(false);
      setInitialized(true);

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

  const signInWithGoogle = async () => {
    try {
      return { success: false, error: 'Google sign-in is not configured for this build yet.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in failed' };
    }
  };

  const signInWithFacebook = async () => {
    try {
      return { success: false, error: 'Facebook sign-in is not configured for this build yet.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Facebook sign-in failed' };
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

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!session?.user) {
      console.log('🔐 [useAuth] ❌ No session for avatar upload');
      return null;
    }
    
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${session.user.id}/avatar.${fileExt}`;
      const mimeType = fileExt === 'jpg' ? 'image/jpeg' : fileExt === 'png' ? 'image/png' : `image/${fileExt}`;
      
      console.log('🔐 [useAuth] 📤 Uploading avatar...', { filePath, mimeType });
      
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });
      
      if (uploadError) {
        console.log('🔐 [useAuth] ❌ Upload error:', uploadError.message);
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);
      
      if (updateError) {
        console.log('🔐 [useAuth] ❌ Profile update error:', updateError.message);
        throw updateError;
      }
      
      await refreshProfile();
      console.log('🔐 [useAuth] ✅ Avatar uploaded successfully');
      
      return publicUrl;
    } catch (err: any) {
      console.log('🔐 [useAuth] ❌ Avatar upload error:', err.message || JSON.stringify(err));
      return null;
    }
  };

  return { 
    session, 
    user,
    profile, 
    loading, 
    initialized,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signUp, 
    signOut,
    refreshProfile,
    updateProfile,
    updatePassword,
    uploadAvatar,
  };
}