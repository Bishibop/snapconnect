import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export const profilesService = {
  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async updateUserBio(userId: string, bio: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').update({ bio }).eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating bio:', error);
      return false;
    }
  },

  subscribeToProfileChanges(userId: string, callback: (profile: Profile) => void) {
    // Create a unique channel name with timestamp to avoid conflicts
    const channelName = `profile_${userId}_${Date.now()}`;

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        payload => {
          if (payload.new) {
            callback(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },
};
