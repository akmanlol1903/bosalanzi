import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOnline: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  checkIsAdmin: () => Promise<boolean>;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  updateOnlineStatus: (status: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  isAdmin: false,
  isOnline: false,
  
  setUser: async (user) => {
    if (user) {
      // Update user metadata with username if not set
      if (!user.user_metadata.username) {
        const { data } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (data?.username) {
          await supabase.auth.updateUser({
            data: { username: data.username }
          });
          
          user.user_metadata.username = data.username;
        }
      }
      
      // Update followers and following counts
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id)
      ]);

      await supabase
        .from('users')
        .update({
          followers_count: followersCount,
          following_count: followingCount
        })
        .eq('id', user.id);
      
      const isAdmin = await get().checkIsAdmin();
      set({ user, isAdmin });
      await get().updateOnlineStatus(true);
    } else {
      await get().updateOnlineStatus(false);
      set({ user: null, isAdmin: false, isOnline: false });
    }
  },
  
  setLoading: (loading) => set({ loading }),
  
  checkIsAdmin: async () => {
    const user = get().user;
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
      
    if (error || !data) return false;
    const isAdmin = !!data.is_admin;
    set({ isAdmin });
    return isAdmin;
  },
  
  updateOnlineStatus: async (status: boolean) => {
    const user = get().user;
    if (!user) return;

    const updateStatus = async (isActive: boolean) => {
      await supabase
        .from('users')
        .update({ 
          is_online: isActive,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);

      set({ isOnline: isActive });
    };

    if (status) {
      // Set initial online status
      await updateStatus(true);

      // Update status when tab visibility changes
      const handleVisibilityChange = () => {
        updateStatus(document.visibilityState === 'visible');
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Update status before unload
      const handleBeforeUnload = () => {
        updateStatus(false);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Periodic status update
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          updateStatus(true);
        }
      }, 30000);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        clearInterval(interval);
        updateStatus(false);
      };
    } else {
      await updateStatus(false);
    }
  },
  
  signInWithDiscord: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'none'
        }
      }
    });
    
    if (error) {
      console.error('Error signing in:', error);
    }
    set({ loading: false });
  },
  
  signOut: async () => {
    await get().updateOnlineStatus(false);
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false, loading: false, isOnline: false });
  }
}));