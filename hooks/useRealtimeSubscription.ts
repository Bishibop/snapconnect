import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SubscriptionConfig {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  filter?: string;
}

interface UseRealtimeSubscriptionOptions {
  channelName?: string;
  enabled?: boolean;
  dependencies?: any[];
}

type SubscriptionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useRealtimeSubscription(
  configs: SubscriptionConfig | SubscriptionConfig[],
  callback: (payload: any) => void,
  options: UseRealtimeSubscriptionOptions = {}
) {
  const {
    channelName = `realtime-${Math.random().toString(36).substring(2, 9)}`,
    enabled = true,
    dependencies = [],
  } = options;

  const subscriptionRef = useRef<any>(null);
  const callbackRef = useRef(callback);
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Safe cleanup function
  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch (err) {
        console.warn('Error unsubscribing from realtime channel:', err);
      } finally {
        subscriptionRef.current = null;
        setStatus('disconnected');
      }
    }
  };

  useEffect(() => {
    if (!enabled) {
      cleanupSubscription();
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      // Clean up existing subscription
      cleanupSubscription();

      // Create new subscription
      let channel = supabase.channel(channelName);

      // Handle both single config and array of configs
      const configArray = Array.isArray(configs) ? configs : [configs];

      configArray.forEach(config => {
        channel = channel.on(
          'postgres_changes' as any,
          {
            event: config.event || '*',
            schema: config.schema || 'public',
            table: config.table,
            ...(config.filter && { filter: config.filter }),
          },
          (payload: any) => {
            try {
              callbackRef.current(payload);
            } catch (err) {
              console.error('Error in realtime callback:', err);
              setError('Callback execution failed');
            }
          }
        );
      });

      // Subscribe with state tracking
      const subscription = channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
          setError('Channel subscription failed');
        } else if (status === 'TIMED_OUT') {
          setStatus('error');
          setError('Subscription timed out');
        }
      });

      subscriptionRef.current = subscription;

      // Cleanup function
      return cleanupSubscription;
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Subscription setup failed');
    }
  }, [channelName, enabled, ...dependencies]);

  // Cleanup on unmount - ensure no memory leaks
  useEffect(() => {
    return cleanupSubscription;
  }, []);

  return {
    status,
    error,
    unsubscribe: cleanupSubscription,
  };
}

// Convenience hooks for common patterns
export function useStoriesSubscription(
  callback: (payload: any) => void,
  options: UseRealtimeSubscriptionOptions = {}
) {
  return useRealtimeSubscription(
    [{ table: 'stories' }, { table: 'story_views' }],
    callback,
    options
  );
}

export function useFriendshipsSubscription(
  userId: string | undefined,
  callback: (payload: any) => void,
  options: UseRealtimeSubscriptionOptions = {}
) {
  const configs = userId
    ? [
        { table: 'friendships', filter: `user_id=eq.${userId}` },
        { table: 'friendships', filter: `friend_id=eq.${userId}` },
      ]
    : [];

  return useRealtimeSubscription(configs, callback, {
    ...options,
    enabled: !!userId && options.enabled !== false,
    dependencies: [userId, ...(options.dependencies || [])],
  });
}

export function useTableSubscription(
  table: string,
  callback: (payload: any) => void,
  options: UseRealtimeSubscriptionOptions = {}
) {
  return useRealtimeSubscription({ table }, callback, options);
}
