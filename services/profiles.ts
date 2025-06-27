import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { ErrorHandler } from '../utils/errorHandler';

export const profilesService = {
  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) throw error;
      return data;
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetch profile', true);
      return null;
    }
  },

  async updateUserBio(userId: string, bio: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').update({ bio }).eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      ErrorHandler.handleApiError(error, 'update bio', true);
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
