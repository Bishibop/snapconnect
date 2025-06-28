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

  // Initialize single channel
  const initializeChannel = useCallback(() => {
    if (channelRef.current || !user?.id) return;

    try {
      const channel = supabase.channel('app-realtime-unified', {
        config: {
          presence: { key: user.id },
        },
      });

      channel.subscribe((status: string) => {
        if (!isMountedRef.current) return;

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Unified realtime channel connected
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          // Unified realtime channel error
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          // Unified realtime channel closed
        }
      });

      channelRef.current = channel;

      // Set up consolidated listeners for all tables we care about
      setupConsolidatedListeners(channel);
    } catch {
      // Error initializing realtime channel
      setIsConnected(false);
    }
  }, [user?.id]);

  // Set up listeners for all our main tables in a single channel
  const setupConsolidatedListeners = useCallback(
    (channel: any) => {
      if (!user?.id) return;

      // Listen to stories table
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
        },
        (payload: any) => handleRealtimeEvent('stories', payload)
      );

      // Listen to story_views table
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

      subscriptionsRef.current.set(id, {
        id,
        configs,
        callback,
        enabled,
      });

      // Initialize channel if not already done
      if (!channelRef.current && user?.id) {
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
    if (user?.id && !channelRef.current) {
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
