import { useState, useEffect } from 'react';
import { profilesService } from '../services/profiles';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';

/**
 * Lightweight hook for getting just the username from a user profile
 * Does not participate in global state management - optimized for display-only use cases
 */
export function useProfileUsername(userId: string): string {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    if (!userId || userId.trim() === '') {
      setUsername('');
      return;
    }

    // Try to get username from cached profile first
    const cachedProfile = cache.get<any>(CACHE_KEYS.USER_PROFILE, userId, CACHE_DURATIONS.PROFILE);
    if (cachedProfile?.username) {
      setUsername(cachedProfile.username);
      return;
    }

    // If not in cache, fetch the profile
    const fetchUsername = async () => {
      try {
        const profile = await profilesService.getUserProfile(userId);

        if (profile) {
          // Cache the full profile for other hooks to use
          cache.set(CACHE_KEYS.USER_PROFILE, profile, userId);

          // Set just the username for this hook
          setUsername(profile.username);
        } else {
          setUsername('');
        }
      } catch (error) {
        console.error('Error fetching username for user:', userId, error);
        setUsername(''); // Fallback to empty string on error
      }
    };

    fetchUsername();
  }, [userId]);

  return username;
}
