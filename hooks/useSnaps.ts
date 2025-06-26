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

interface UseSnapsOptions {
  type: 'inbox' | 'sent';
}

export function useSnaps({ type }: UseSnapsOptions) {
  const { user } = useAuth();
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnaps = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const snapsList = type === 'inbox' 
        ? await getInboxSnaps() 
        : await getSentSnaps();
      setSnaps(snapsList);
    } catch (error) {
      console.error(`Error loading ${type} snaps:`, error);
      setError(`Failed to load ${type} snaps`);
      Alert.alert('Error', `Failed to load ${type} snaps`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, type]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadSnaps();
  }, [loadSnaps]);

  const markOpened = useCallback(async (snapId: string) => {
    if (type !== 'inbox') return;

    try {
      await markSnapOpened(snapId);
      // Update local state
      setSnaps(prev =>
        prev.map(snap =>
          snap.id === snapId 
            ? { ...snap, opened_at: new Date().toISOString() } 
            : snap
        )
      );
    } catch (error) {
      console.error('Error marking snap as opened:', error);
    }
  }, [type]);

  // Initial load
  useEffect(() => {
    loadSnaps();
  }, [loadSnaps]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = type === 'inbox'
      ? subscribeToInboxChanges(user.id, loadSnaps)
      : subscribeToSentSnapsChanges(user.id, loadSnaps);

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, type, loadSnaps]);

  return {
    snaps,
    loading,
    refreshing,
    error,
    refresh,
    markOpened,
    reload: loadSnaps,
  };
}