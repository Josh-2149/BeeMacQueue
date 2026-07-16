import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole, BrandType } from '../types';

console.log('🔵 useAuth hook initialized');

export function useAuth() {
  console.log('🔄 useAuth hook rendering');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    console.log(`📥 Loading profile for user: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.log('❌ Error loading profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded from database:', data);
        setProfile(data as Profile);
      } else {
        console.log('🆕 No profile found, creating new profile');
        const { data: userData } = await supabase.auth.getUser();
        const meta = userData?.user?.user_metadata ?? {};
        const newProfile = {
          id: userId,
          name: meta.full_name ?? meta.name ?? userData?.user?.email?.split('@')[0] ?? 'User',
          email: userData?.user?.email ?? '',
          role: 'customer' as const,
          brand: meta.brand || null,
          branch: meta.branch || null,
          queues_joined: 0,
        };
        console.log('📝 Creating profile:', newProfile);
        const { error: upsertError } = await supabase.from('profiles').upsert(newProfile);
        if (upsertError) {
          console.log('❌ Error creating profile:', upsertError);
        } else {
          console.log('✅ Profile created successfully');
        }
        setProfile(newProfile as Profile);
      }
    } catch (err) {
      console.log('❌ Unexpected error in loadProfile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 useAuth useEffect running');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📊 Session loaded:', session ? 'Active' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('👤 User found, loading profile');
        loadProfile(session.user.id);
      } else {
        console.log('🚫 No user, setting loading false');
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log(`🔐 Auth state changed: ${_event}`);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('👤 User logged in, loading profile');
          await loadProfile(session.user.id);
        } else {
          console.log('🚫 User logged out');
          setProfile(null);
          setLoading(false);
        }
      }
    );
    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  async function signInEmail(email: string, password: string) {
    console.log(`🔐 Signing in with email: ${email}`);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.log('❌ Sign in error:', error);
        return false;
      }
      console.log('✅ Sign in successful');
      return true;
    } catch (err) {
      console.log('❌ Unexpected sign in error:', err);
      return false;
    }
  }

  async function signUpEmail(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'customer',
    brand?: BrandType,
    branch?: string
  ) {
    console.log(`📝 Signing up user: ${email}, role: ${role}`);
    if (role === 'staff') {
      console.log(`🏢 Staff details - Brand: ${brand}, Branch: ${branch}`);
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            brand: role === 'staff' ? brand : null,
            branch: role === 'staff' ? branch : null
          }
        },
      });
      
      if (error) {
        console.log('❌ Sign up error:', error);
        return false;
      }
      
      if (data.user) {
        console.log('✅ User created, creating profile');
        const profileData: any = {
          id: data.user.id,
          name,
          email,
          role,
          queues_joined: 0,
        };
        
        if (role === 'staff') {
          profileData.brand = brand;
          profileData.branch = branch;
        }
        
        console.log('📝 Profile data:', profileData);
        const { error: profileError } = await supabase.from('profiles').upsert(profileData);
        if (profileError) {
          console.log('❌ Profile creation error:', profileError);
          return false;
        }
        console.log('✅ Profile created successfully');
      }
      return true;
    } catch (err) {
      console.log('❌ Unexpected sign up error:', err);
      return false;
    }
  }

  async function updateProfile(updates: Partial<Pick<Profile, 'name'>>) {
    if (!user) {
      console.log('❌ Cannot update profile: No user');
      return false;
    }
    console.log(`📝 Updating profile for user: ${user.id}`, updates);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) {
      console.log('❌ Profile update error:', error);
      return false;
    }
    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
    console.log('✅ Profile updated successfully');
    return true;
  }

  async function updatePassword(newPassword: string) {
    console.log('🔐 Updating password');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.log('❌ Password update error:', error);
      return false;
    }
    console.log('✅ Password updated successfully');
    return true;
  }

  async function resetPassword(email: string) {
    console.log(`📧 Sending password reset for: ${email}`);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'beemacqueue://auth/reset',
    });
    if (error) {
      console.log('❌ Password reset error:', error);
      return false;
    }
    console.log('✅ Password reset email sent');
    return true;
  }

  async function signOut() {
    console.log('🚪 Signing out');
    await supabase.auth.signOut();
    setProfile(null);
    console.log('✅ Signed out successfully');
  }

  return {
    session,
    user,
    profile,
    loading,
    signInEmail,
    signUpEmail,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
  };
}