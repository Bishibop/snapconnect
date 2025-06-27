import { useState, useEffect, useCallback, useRef } from 'react';
import { profilesService } from '../services/profiles';
import { Profile } from '../types';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';

// Global state for profile to ensure all hook instances stay in sync
const profileStateMap = new Map<string, Profile | null>();
const profileListeners = new Map<string, Set<(profile: Profile | null) => void>>();

function getGlobalProfile(userId: string): Profile | null {
  return profileStateMap.get(userId) || null;
}

function setGlobalProfile(userId: string, profile: Profile | null) {
  profileStateMap.set(userId, profile);
  const listeners = profileListeners.get(userId);
  if (listeners) {
    listeners.forEach(listener => listener(profile));
  }
}

function addProfileListener(userId: string, listener: (profile: Profile | null) => void) {
  if (!profileListeners.has(userId)) {
    profileListeners.set(userId, new Set());
  }
  profileListeners.get(userId)!.add(listener);
}

function removeProfileListener(userId: string, listener: (profile: Profile | null) => void) {
  const listeners = profileListeners.get(userId);
  if (listeners) {
    listeners.delete(listener);
    if (listeners.size === 0) {
      profileListeners.delete(userId);
    }
  }
}

export function useProfile(userId: string) {
  // Track component mount state to prevent crashes from setState on unmounted components
  const isMountedRef = useRef(true);

  // Initialize with global state or cached data
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (!userId || userId.trim() === '') return null;

    // Check global state first
    const globalProfile = getGlobalProfile(userId);
    if (globalProfile) return globalProfile;

    // Fall back to cache
    const cachedProfile = cache.get<Profile>(
      CACHE_KEYS.USER_PROFILE,
      userId,
      CACHE_DURATIONS.PROFILE
    );
    if (cachedProfile) {
      // Don't call setGlobalProfile during initialization to prevent loops
      return cachedProfile;
    }

    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const currentUserId = useRef(userId);

  // Safe setState wrapper to prevent crashes
  const safeSetProfile = useCallback((newProfile: Profile | null) => {
    if (isMountedRef.current) {
      setProfile(newProfile);
    }
  }, []);

  const safeSetLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setLoading(loading);
    }
  }, []);

  const safeSetError = useCallback((error: string | null) => {
    if (isMountedRef.current) {
      setError(error);
    }
  }, []);

  // Reset initialization flag when userId changes
  if (currentUserId.current !== userId) {
    hasInitialized.current = false;
    currentUserId.current = userId;
  }

  // Set up listener for global state changes with crash protection
  useEffect(() => {
    if (!userId || userId.trim() === '') {
      safeSetProfile(null);
      return;
    }

    const listener = (newProfile: Profile | null) => {
      try {
        safeSetProfile(newProfile);
      } catch (error) {
        console.error('Error in profile listener:', error);
        // Don't crash the app, just log the error
      }
    };

    addProfileListener(userId, listener);

    return () => {
      try {
        removeProfileListener(userId, listener);
      } catch (error) {
        console.error('Error removing profile listener:', error);
      }
    };
  }, [userId, safeSetProfile]);

  useEffect(() => {
    if (!userId || userId.trim() === '') {
      safeSetLoading(false);
      hasInitialized.current = false;
      return;
    }

    // Prevent re-running if we've already initialized for this userId
    if (hasInitialized.current) {
      return;
    }

    // Check if we already have this profile in global state
    const globalProfile = getGlobalProfile(userId);
    if (globalProfile) {
      safeSetLoading(false);
      hasInitialized.current = true;
      return;
    }

    // Check if we have fresh cached data
    const cachedProfile = cache.get<Profile>(
      CACHE_KEYS.USER_PROFILE,
      userId,
      CACHE_DURATIONS.PROFILE
    );
    if (cachedProfile) {
      // Sync cached profile to global state (this may have been skipped during initialization)
      try {
        if (!getGlobalProfile(userId)) {
          setGlobalProfile(userId, cachedProfile);
        }
        safeSetLoading(false);
        hasInitialized.current = true;
      } catch (error) {
        console.error('Error syncing cached profile to global state:', error);
      }
    } else {
      // Load fresh data if no valid cache
      const fetchProfile = async () => {
        try {
          safeSetLoading(true);
          const data = await profilesService.getUserProfile(userId);

          if (!isMountedRef.current) return; // Component was unmounted during fetch

          // Update cache and global state
          cache.set(CACHE_KEYS.USER_PROFILE, data, userId);
          setGlobalProfile(userId, data);
          safeSetError(null);
          hasInitialized.current = true;
        } catch (err) {
          if (!isMountedRef.current) return; // Component was unmounted during fetch

          safeSetError('Failed to load profile');
          console.error('Error loading profile:', err);
        } finally {
          safeSetLoading(false);
        }
      };

      fetchProfile().catch(error => {
        console.error('Unhandled error in fetchProfile:', error);
      });
    }
  }, [userId, safeSetLoading, safeSetError]);

  const updateBio = useCallback(
    async (bio: string) => {
      if (!userId || userId.trim() === '') return false;

      try {
        const success = await profilesService.updateUserBio(userId, bio);

        if (success && isMountedRef.current) {
          // Get current profile from global state or cache
          const currentProfile =
            getGlobalProfile(userId) || cache.get<Profile>(CACHE_KEYS.USER_PROFILE, userId);
          const updatedProfile = currentProfile ? { ...currentProfile, bio } : null;

          if (updatedProfile) {
            // Update both cache and global state (which will notify all listeners)
            cache.set(CACHE_KEYS.USER_PROFILE, updatedProfile, userId);
            setGlobalProfile(userId, updatedProfile);
          }
        }

        return success;
      } catch (error) {
        console.error('Error updating bio:', error);
        return false;
      }
    },
    [userId]
  );

  // Mark component as unmounted to prevent crashes
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    profile,
    loading,
    error,
    updateBio,
  };
}
