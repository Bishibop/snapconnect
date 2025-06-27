import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ConversationsStackParamList, Conversation } from '../../types';
import { theme } from '../../constants/theme';
import { conversationsService } from '../../services/conversations';
import { useAuth } from '../../contexts/AuthContext';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import { formatRelativeTime } from '../../utils/dateTime';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../../utils/cache';

type NavigationProp = StackNavigationProp<ConversationsStackParamList, 'ConversationsList'>;

const ConversationsListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  // Initialize with cached data immediately
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (!user?.id) return [];
    return (
      cache.get<Conversation[]>(CACHE_KEYS.CONVERSATIONS, user.id, CACHE_DURATIONS.CONVERSATIONS) ||
      []
    );
  });
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(() => {
    // If we have cached data, consider it as already loaded
    if (!user?.id) return false;
    return cache.has(CACHE_KEYS.CONVERSATIONS, user.id, CACHE_DURATIONS.CONVERSATIONS);
  });

  const loadConversations = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setRefreshing(true);
        }

        const data = await conversationsService.getConversations();

        // Update both state and cache atomically
        setConversations(data);
        if (user?.id) {
          cache.set(CACHE_KEYS.CONVERSATIONS, data, user.id);
        }

        // Mark that we've completed at least one load
        setHasLoadedOnce(true);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) return;

    // Check if we have valid cached data
    const hasValidCache = cache.has(
      CACHE_KEYS.CONVERSATIONS,
      user.id,
      CACHE_DURATIONS.CONVERSATIONS
    );

    if (!hasValidCache) {
      // Only show loading if we don't have cached data
      loadConversations();
    } else {
      // Silent background refresh to get latest data
      loadConversations(true);
    }

    // Subscribe to conversation updates
    const unsubscribe = conversationsService.subscribeToConversations(() => {
      // Silent refresh when we get realtime updates
      loadConversations(true);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, loadConversations]);

  const handleRefresh = () => {
    // Explicit refresh always shows loading
    loadConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('ConversationDetail', {
      conversationId: conversation.id,
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation; index: number }) => {
    const otherParticipant =
      item.participant1_id === user?.id ? item.participant2 : item.participant1;

    if (!otherParticipant) {
      return <View />; // Return empty view instead of null
    }

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {otherParticipant.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          {item.unread_count ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread_count}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.username}>{otherParticipant.username}</Text>
            {item.last_message_at && (
              <Text style={styles.timestamp}>{formatRelativeTime(item.last_message_at)}</Text>
            )}
          </View>
          {item.last_message && (
            <Text
              style={[styles.lastMessage, item.unread_count ? styles.unreadMessage : null]}
              numberOfLines={1}
            >
              {item.last_message.sender_id === user?.id ? 'You: ' : ''}
              {item.last_message.message_type === 'vibe_check' 
                ? 'Sent a VibeCheck' 
                : item.last_message.content || 'Message'
              }
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Conversations" showLoading={refreshing} />
      <RefreshableList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        style={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          hasLoadedOnce ? (
            <EmptyState
              icon="💬"
              title="No Conversations Yet"
              subtitle="Start a conversation with your friends!"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  unreadMessage: {
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default ConversationsListScreen;
