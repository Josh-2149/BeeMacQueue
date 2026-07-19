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
            console.log(`🔐 [useAuth] User ID: ${session.user.id}`);
            console.log('🔐 [useAuth] Loading profile...');
            
            const { data, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileError) {
              console.log('🔐 [useAuth] Profile error:', profileError.message);
            } else {
              console.log(`🔐 [useAuth] Profile loaded: role=${data?.role || 'none'}, brand=${data?.brand || 'none'}, branch=${data?.branch || 'none'}`);
              setProfile(data as Profile || null);
            }
          } else {
            console.log('🔐 [useAuth] No user in session');
            setProfile(null);
          }
          
          setLoading(false);
          setInitialized(true);
          console.log('🔐 [useAuth] Initial load complete');
          console.log(`🔐 [useAuth] State: session=${!!session}, user=${!!session?.user}, profile=${!!profile}`);
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
          console.log('🔐 [useAuth] User signed out');
          setProfile(null);
          setUser(null);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        if (newSession?.user) {
          console.log(`🔐 [useAuth] User ${event}: ${newSession.user.email}`);
          console.log(`🔐 [useAuth] User ID: ${newSession.user.id}`);
          console.log('🔐 [useAuth] Loading profile after auth change...');
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .maybeSingle();
          
          if (error) {
            console.log('🔐 [useAuth] Profile error on auth change:', error.message);
          } else {
            console.log(`🔐 [useAuth] Profile updated: role=${data?.role || 'none'}`);
            setProfile(data as Profile || null);
          }
        } else {
          console.log('🔐 [useAuth] No user in new session');
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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        console.log('🔐 [useAuth] ❌ Sign in error:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log(`🔐 [useAuth] ✅ Sign in success: ${data.user?.email}`);
      console.log(`🔐 [useAuth] User ID: ${data.user?.id}`);
      return { success: true };
    } catch (err) {
      console.log('🔐 [useAuth] ❌ Sign in exception:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string, brand?: string, branch?: string) => {
    console.log(`🔐 [useAuth] 📝 Sign up attempt: ${email}, role: ${role}`);
    
    if (role === 'staff' && (!brand || !branch)) {
      console.log('🔐 [useAuth] ❌ Staff signup missing brand or branch');
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
            brand: role === 'staff' ? brand : null,
            branch: role === 'staff' ? branch : null
          } 
        }
      });
      
      if (error) {
        console.log('🔐 [useAuth] ❌ Sign up error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.log('🔐 [useAuth] ❌ No user created');
        return { success: false, error: 'No user created' };
      }

      console.log(`🔐 [useAuth] ✅ User created: ${data.user.id}`);

      const profileData = {
        id: data.user.id,
        name: name.trim(),
        email: email.trim(),
        role,
        brand: role === 'staff' ? brand : null,
        branch: role === 'staff' ? branch : null,
        queues_joined: 0,
      };
      
      console.log('🔐 [useAuth] 📝 Creating profile:', profileData);
      
      const { error: pe } = await supabase
        .from('profiles')
        .insert(profileData);
      
      if (pe) {
        console.log('🔐 [useAuth] ❌ Profile error:', pe.message);
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData);
        
        if (upsertError) {
          console.log('🔐 [useAuth] ❌ Upsert also failed:', upsertError.message);
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
    if (!session?.user) {
      console.log('🔐 [useAuth] ⚠️ Cannot refresh profile - no user');
      return;
    }
    
    console.log('🔐 [useAuth] 🔄 Refreshing profile...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (error) {
      console.log('🔐 [useAuth] ❌ Refresh error:', error.message);
    } else {
      console.log(`🔐 [useAuth] ✅ Profile refreshed: role=${data?.role || 'none'}`);
      setProfile(data as Profile || null);
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
    refreshProfile
  };
}