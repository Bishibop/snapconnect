import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  getInboxSnaps, 
  getSentSnaps, 
  markSnapOpened, 
  subscribeToInboxChanges,
  subscribeToSentSnapsChanges,
  Snap 
} from '../services/snaps';
import { useAuth } from '../contexts/AuthContext';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../utils/cache';

interface UseSnapsOptions {
  type: 'inbox' | 'sent';
}

export function useSnaps({ type }: UseSnapsOptions) {
  const { user } = useAuth();
  const cacheKey = type === 'inbox' ? CACHE_KEYS.INBOX_SNAPS : CACHE_KEYS.SENT_SNAPS;
  
  // Initialize with cached data synchronously
  const [snaps, setSnaps] = useState<Snap[]>(() => {
    if (!user?.id) return [];
    return cache.get<Snap[]>(cacheKey, user.id, CACHE_DURATIONS.SNAPS) || [];
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnaps = useCallback(async (silent = false) => {
    if (!user?.id) return;

    try {
      setError(null);
      if (!silent) setRefreshing(true);
      
      const snapsList = type === 'inbox' 
        ? await getInboxSnaps() 
        : await getSentSnaps();
      setSnaps(snapsList);
      
      // Cache the new data
      cache.set(cacheKey, snapsList, user.id);
    } catch (error) {
      console.error(`Error loading ${type} snaps:`, error);
      setError(`Failed to load ${type} snaps`);
      if (!silent) {
        Alert.alert('Error', `Failed to load ${type} snaps`);
      }
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, type, cacheKey]);


  const markOpened = useCallback(async (snapId: string) => {
    if (type !== 'inbox') return;

    try {
      await markSnapOpened(snapId);
      // Update local state
      const updatedSnaps = snaps.map(snap =>
        snap.id === snapId 
          ? { ...snap, opened_at: new Date().toISOString() } 
          : snap
      );
      setSnaps(updatedSnaps);
      
      // Update cache
      if (user?.id) {
        cache.set(cacheKey, updatedSnaps, user.id);
      }
    } catch (error) {
      console.error('Error marking snap as opened:', error);
    }
  }, [type, snaps, user?.id, cacheKey]);

  // Background fetch for fresh data
  useEffect(() => {
    if (!user?.id) return;
    
    // Check if we need fresh data
    const hasValidCache = cache.has(cacheKey, user.id, CACHE_DURATIONS.SNAPS);
    if (!hasValidCache) {
      loadSnaps(true); // Silent background fetch
    }
  }, [user?.id, cacheKey, loadSnaps]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = type === 'inbox'
      ? subscribeToInboxChanges(user.id, () => loadSnaps(true)) // Silent reload on real-time updates
      : subscribeToSentSnapsChanges(user.id, () => loadSnaps(true));

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, type, loadSnaps]);

  return {
    snaps,
    refreshing,
    error,
    markOpened,
    reload: loadSnaps,
  };
}