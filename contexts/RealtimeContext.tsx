import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SubscriptionConfig {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  filter?: string;
}

interface RealtimeSubscription {
  id: string;
  configs: SubscriptionConfig[];
  callback: (payload: any) => void;
  enabled: boolean;
}

interface RealtimeContextType {
  subscribe: (
    id: string,
    configs: SubscriptionConfig[],
    callback: (payload: any) => void,
    enabled?: boolean
  ) => void;
  unsubscribe: (id: string) => void;
  updateSubscription: (
    id: string,
    configs: SubscriptionConfig[],
    callback: (payload: any) => void,
    enabled?: boolean
  ) => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtimeContext(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // Track component mount state
  const isMountedRef = useRef(true);

  // Store all active subscriptions
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());

  // Single channel for all realtime communications
  const channelRef = useRef<any>(null);

  // Throttling for subscription updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  // Track connection attempts
  const connectionAttemptsRef = useRef(0);

  // Initialize single channel
  const initializeChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('[REALTIME] Channel already exists, skipping initialization');
      return;
    }

    if (!user?.id) {
      console.log('[REALTIME] No user ID, skipping initialization');
      return;
    }

    connectionAttemptsRef.current++;
    console.log(
      '[REALTIME] Connection attempt #',
      connectionAttemptsRef.current,
      'at',
      new Date().toISOString()
    );

    try {
      console.log('[REALTIME] Creating channel for user:', user.id, {
        timestamp: new Date().toISOString(),
      });

      const channel = supabase.channel('app-realtime-unified', {
        config: {
          presence: { key: user.id },
        },
      });

      channel.subscribe((status: string, error?: any) => {
        if (!isMountedRef.current) return;

        console.log('[REALTIME] Channel subscription status:', status, {
          timestamp: new Date().toISOString(),
          userId: user.id,
          connectionAttempt: connectionAttemptsRef.current,
        });

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('[REALTIME] Unified realtime channel connected successfully');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          console.error('[REALTIME] Channel error details:', {
            status: status,
            errorMessage: error?.message || 'No error message',
            errorCode: error?.code || 'No error code',
            errorDetails: error?.details || 'No error details',
            errorType: error?.type || 'Unknown',
            errorName: error?.name || 'Unknown',
            fullError: JSON.stringify(error, null, 2),
            connectionAttempt: connectionAttemptsRef.current,
            timestamp: new Date().toISOString(),
          });
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('[REALTIME] Channel closed:', {
            error: error,
            reason: error?.reason || 'No reason provided',
            message: error?.message || 'No message',
            connectionAttempt: connectionAttemptsRef.current,
            timestamp: new Date().toISOString(),
          });
        }
      });

      channelRef.current = channel;

      // Set up consolidated listeners for all tables we care about
      console.log('[REALTIME] Setting up consolidated listeners');
      setupConsolidatedListeners(channel);

      console.log('[REALTIME] Channel initialization complete');
    } catch (error) {
      console.error('[REALTIME] Error initializing realtime channel:', error);
      setIsConnected(false);
    }
  }, [user?.id]);

  // Set up listeners for all our main tables in a single channel
  const setupConsolidatedListeners = useCallback(
    (channel: any) => {
      if (!user?.id) return;

      let listenerCount = 0;

      // Listen to stories table
      console.log('[REALTIME] Adding listener for stories table');
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
        },
        (payload: any) => handleRealtimeEvent('stories', payload)
      );
      listenerCount++;

      // Listen to story_views table
      console.log('[REALTIME] Adding listener for story_views table');
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_views',
          filter: `viewer_id=eq.${user.id}`,
        },
        (payload: any) => handleRealtimeEvent('story_views', payload)
      );

      // Listen to friendships table
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        (payload: any) => handleRealtimeEvent('friendships', payload)
      );

      // Listen to profiles table
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload: any) => handleRealtimeEvent('profiles', payload)
      );

      // Listen to vibe_reels table
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibe_reels',
        },
        (payload: any) => {
          console.log('[REALTIME CONTEXT] VibeReel event received:', payload);
          handleRealtimeEvent('vibe_reels', payload);
        }
      );

      // Listen to vibe_reel_views table
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vibe_reel_views',
          filter: `viewer_id=eq.${user.id}`,
        },
        (payload: any) => handleRealtimeEvent('vibe_reel_views', payload)
      );

      console.log('[REALTIME] Total listeners added:', 6);
      console.log(
        '[REALTIME] Listeners: stories, story_views, friendships, profiles, vibe_reels, vibe_reel_views'
      );
    },
    [user?.id]
  );

  // Handle realtime events and route to appropriate subscriptions
  const handleRealtimeEvent = useCallback((table: string, payload: any) => {
    if (!isMountedRef.current) return;

    // Add to pending updates for throttling
    pendingUpdatesRef.current.add(
      `${table}:${payload.eventType}:${payload.new?.id || payload.old?.id}`
    );

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Throttle updates to prevent spam
    updateTimeoutRef.current = setTimeout(() => {
      const updates = Array.from(pendingUpdatesRef.current);
      pendingUpdatesRef.current.clear();

      if (!isMountedRef.current || updates.length === 0) return;

      // Route events to matching subscriptions
      subscriptionsRef.current.forEach(subscription => {
        if (!subscription.enabled) return;

        const matchingConfig = subscription.configs.find(config => {
          if (config.table !== table) return false;
          if (config.event && config.event !== '*' && config.event !== payload.eventType)
            return false;
          // Add filter matching logic if needed
          return true;
        });

        if (matchingConfig) {
          try {
            subscription.callback(payload);
          } catch {
            // Error in subscription callback
          }
        }
      });
    }, 300); // 300ms throttle
  }, []);

  // Public API: Subscribe to realtime events
  const subscribe = useCallback(
    (
      id: string,
      configs: SubscriptionConfig[],
      callback: (payload: any) => void,
      enabled = true
    ) => {
      if (!isMountedRef.current) return;

      console.log('[REALTIME] Registering subscription:', {
        id,
        tables: configs.map(c => c.table),
        enabled,
      });

      subscriptionsRef.current.set(id, {
        id,
        configs,
        callback,
        enabled,
      });

      console.log('[REALTIME] Active subscriptions:', subscriptionsRef.current.size);

      // Initialize channel if not already done
      if (!channelRef.current && user?.id) {
        console.log('[REALTIME] Channel not initialized, initializing now');
        initializeChannel();
      }
    },
    [user?.id, initializeChannel]
  );

  // Public API: Unsubscribe from realtime events
  const unsubscribe = useCallback((id: string) => {
    subscriptionsRef.current.delete(id);
  }, []);

  // Public API: Update existing subscription
  const updateSubscription = useCallback(
    (
      id: string,
      configs: SubscriptionConfig[],
      callback: (payload: any) => void,
      enabled = true
    ) => {
      if (!isMountedRef.current) return;

      const existing = subscriptionsRef.current.get(id);
      if (existing) {
        subscriptionsRef.current.set(id, {
          ...existing,
          configs,
          callback,
          enabled,
        });
      } else {
        subscribe(id, configs, callback, enabled);
      }
    },
    [subscribe]
  );

  // Initialize channel when user is available
  useEffect(() => {
    console.log('[REALTIME] User effect triggered:', {
      hasUser: !!user?.id,
      hasChannel: !!channelRef.current,
      userId: user?.id,
    });

    if (user?.id && !channelRef.current) {
      console.log('[REALTIME] User authenticated, initializing channel');
      initializeChannel();
    } else if (!user?.id && channelRef.current) {
      // Clean up when user logs out
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing channel:', error);
      }
      channelRef.current = null;
      setIsConnected(false);
      subscriptionsRef.current.clear();
    }
  }, [user?.id, initializeChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
        } catch {
          // Error cleaning up realtime channel
        }
      }

      subscriptionsRef.current.clear();
    };
  }, []);

  const contextValue: RealtimeContextType = {
    subscribe,
    unsubscribe,
    updateSubscription,
    isConnected,
  };

  return <RealtimeContext.Provider value={contextValue}>{children}</RealtimeContext.Provider>;
}
