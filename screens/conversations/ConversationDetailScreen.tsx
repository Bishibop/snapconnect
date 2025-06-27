import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ConversationsStackParamList,
  TextMessage,
  VibeCheckMessage,
  ConversationMessage,
  Conversation,
} from '../../types';
import { theme } from '../../constants/theme';
import { conversationsService } from '../../services/conversations';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { formatMessageTime } from '../../utils/dateTime';
import { cache, CACHE_KEYS, CACHE_DURATIONS } from '../../utils/cache';
import VibeCheckMessageComponent from '../../components/VibeCheckMessage';
import { useNavigationHelpers } from '../../utils/navigation';

type RouteParams = RouteProp<ConversationsStackParamList, 'ConversationDetail'>;
type NavigationProp = StackNavigationProp<ConversationsStackParamList, 'ConversationDetail'>;

// Memoized TextMessage component to prevent unnecessary re-renders
const TextMessageComponent = memo(
  ({ message, isOwnMessage }: { message: TextMessage; isOwnMessage: boolean }) => {
    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        <View
          style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}
        >
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {message.content}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {formatMessageTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  }
);

const ConversationDetailScreen = () => {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const navHelpers = useNavigationHelpers(navigation);
  const { user } = useAuth();
  const { profile: currentUserProfile } = useProfile(user?.id || '');

  const flatListRef = useRef<FlatList>(null);

  const [conversation, setConversation] = useState<Conversation | null>(() => {
    // Initialize with cached conversation if available
    if (!user?.id || !route.params?.conversationId) return null;

    const cached = cache.get<Conversation[]>(
      CACHE_KEYS.CONVERSATIONS,
      user.id,
      CACHE_DURATIONS.CONVERSATIONS
    );
    return cached?.find(c => c.id === route.params.conversationId) || null;
  });
  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    // Initialize with cached messages if available
    if (!user?.id || !route.params?.conversationId) return [];

    return (
      cache.get<ConversationMessage[]>(
        CACHE_KEYS.CONVERSATION_MESSAGES,
        `${user.id}:${route.params.conversationId}`,
        CACHE_DURATIONS.MESSAGES
      ) || []
    );
  });
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(() => {
    // Initialize loading state based on whether we have cached messages
    if (!user?.id || !route.params?.conversationId) return false;

    const cachedMessages = cache.get<ConversationMessage[]>(
      CACHE_KEYS.CONVERSATION_MESSAGES,
      `${user.id}:${route.params.conversationId}`,
      CACHE_DURATIONS.MESSAGES
    );

    // If we don't have cached messages, we should be loading
    return !cachedMessages || cachedMessages.length === 0;
  });
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const optimisticMessageIdRef = useRef<string | null>(null);
  const [pendingVibeCheck, setPendingVibeCheck] = useState(route.params?.pendingVibeCheck);

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!conversation || !user?.id) return;

      try {
        if (!silent) {
          setLoadingMessages(true);
        }

        const msgs = await conversationsService.getMessages(conversation.id);

        // Update both state and cache atomically
        setMessages(msgs);
        const messagesCacheKey = `${user.id}:${conversation.id}`;
        cache.set(CACHE_KEYS.CONVERSATION_MESSAGES, msgs, messagesCacheKey);

        // Mark messages as read
        await conversationsService.markMessagesAsRead(conversation.id);

        // Scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    },
    [conversation, user?.id]
  );

  const loadConversation = useCallback(async () => {
    if (!route.params?.conversationId && !route.params?.recipientId) return;
    if (!user?.id) return;

    try {
      setLoadingConversation(true);
      let conv: Conversation;

      if (route.params.conversationId) {
        // Try to get from cache first
        const cachedConversations = cache.get<Conversation[]>(
          CACHE_KEYS.CONVERSATIONS,
          user.id,
          CACHE_DURATIONS.CONVERSATIONS
        );
        const cachedConv = cachedConversations?.find(c => c.id === route.params.conversationId);

        if (cachedConv) {
          conv = cachedConv;
        } else {
          // Load fresh conversation data
          const convs = await conversationsService.getConversations();
          const found = convs.find(c => c.id === route.params.conversationId);
          if (!found) throw new Error('Conversation not found');
          conv = found;

          // Update cache
          cache.set(CACHE_KEYS.CONVERSATIONS, convs, user.id);
        }
      } else if (route.params.recipientId) {
        // Create or get conversation with recipient
        conv = await conversationsService.getOrCreateConversation(route.params.recipientId);
      } else {
        throw new Error('No conversation ID or recipient ID provided');
      }

      setConversation(conv);
      setLoadingConversation(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setLoadingConversation(false);
    }
  }, [route.params, user?.id]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Add pending VibeCheck message when navigating from friend selector
  useEffect(() => {
    if (pendingVibeCheck && conversation && user?.id) {
      const tempId = `pending-${Date.now()}`;
      const pendingMessage: TextMessage = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: user.id,
        message_type: 'text',
        content: `📸 Sending ${pendingVibeCheck.mediaType}...`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: currentUserProfile || {
          id: user.id,
          username: 'You',
          created_at: new Date().toISOString(),
        },
      };

      // Track this pending message ID
      optimisticMessageIdRef.current = tempId;

      // Add pending message to the list
      setMessages(prev => [...prev, pendingMessage]);

      // Clear pending state
      setPendingVibeCheck(undefined);

      // Scroll to bottom without delay for immediate feedback
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [pendingVibeCheck, conversation, user?.id, currentUserProfile]);

  useEffect(() => {
    if (!conversation || !user?.id) return;

    // Check if we have valid cached messages
    const messagesCacheKey = `${user.id}:${conversation.id}`;
    const hasValidCache = cache.has(
      CACHE_KEYS.CONVERSATION_MESSAGES,
      messagesCacheKey,
      CACHE_DURATIONS.MESSAGES
    );

    if (!hasValidCache) {
      loadMessages();
    } else {
      loadMessages(true);
    }

    // Subscribe to message updates
    const unsubscribe = conversationsService.subscribeToMessages(conversation.id, newMessage => {
      setMessages(prev => {
        // Don't add if message already exists (avoid duplicates from optimistic updates)
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return prev;
        }

        // Special handling for our own messages during optimistic updates
        if (newMessage.sender_id === user?.id && optimisticMessageIdRef.current) {
          // Replace the optimistic message with the real one
          const updated = prev.filter(msg => msg.id !== optimisticMessageIdRef.current);
          optimisticMessageIdRef.current = null;
          return [...updated, newMessage];
        }

        const updatedMessages = [...prev, newMessage];

        // Update cache with new messages
        cache.set(CACHE_KEYS.CONVERSATION_MESSAGES, updatedMessages, messagesCacheKey);

        return updatedMessages;
      });

      // Mark as read if not from current user
      if (newMessage.sender_id !== user?.id) {
        conversationsService.markMessagesAsRead(conversation.id);
      }

      // Scroll to bottom for new messages from others
      if (newMessage.sender_id !== user?.id) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversation, user?.id, loadMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    // Optimistic update - add message immediately to UI
    const tempId = `temp-${Date.now()}`;

    if (!user?.id) {
      console.error('User not authenticated');
      setSending(false);
      return;
    }

    const optimisticMessage: TextMessage = {
      id: tempId, // Temporary ID
      conversation_id: conversation.id,
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_type: 'text',
      sender: currentUserProfile || {
        id: user.id,
        username: 'You',
        created_at: new Date().toISOString(),
      },
    };

    // Track the optimistic message to prevent real-time duplicates
    optimisticMessageIdRef.current = tempId;

    // Batch the state update and cache update together
    setMessages(prev => {
      const updated = [...prev, optimisticMessage];
      // Update cache with optimistic message
      const messagesCacheKey = `${user.id}:${conversation.id}`;
      cache.set(CACHE_KEYS.CONVERSATION_MESSAGES, updated, messagesCacheKey);
      return updated;
    });

    // For own messages, scroll without animation to reduce repaints
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 50);

    try {
      const sentMessage = await conversationsService.sendMessage(conversation.id, text);

      // Replace optimistic message with real message efficiently
      setMessages(prev => {
        // Find the optimistic message and replace it
        const optimisticIndex = prev.findIndex(msg => msg.id === tempId);
        if (optimisticIndex === -1) {
          // Optimistic message not found, just append
          return [...prev, sentMessage];
        }

        // Replace the optimistic message with the real one
        // Use splice for better performance with large arrays
        const updated = [...prev];
        updated.splice(optimisticIndex, 1, sentMessage);

        // Update cache with real message after state update
        const messagesCacheKey = `${user.id}:${conversation.id}`;
        setTimeout(() => {
          cache.set(CACHE_KEYS.CONVERSATION_MESSAGES, updated, messagesCacheKey);
        }, 0);

        return updated;
      });

      // Clear the optimistic message tracking
      optimisticMessageIdRef.current = null;
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));

      // Restore message text for retry
      setMessageText(text);

      // Clear the optimistic message tracking on error too
      optimisticMessageIdRef.current = null;
    } finally {
      setSending(false);
    }
  };

  const handleVibeCheckPress = useCallback(
    (vibeCheck: VibeCheckMessage) => {
      if (vibeCheck.vibe_check) {
        // Senders can always view their own VibeChecks
        // Recipients can only view if not yet opened
        const isOwnMessage = vibeCheck.sender_id === user?.id;
        if (isOwnMessage || vibeCheck.vibe_check.status !== 'opened') {
          // If recipient is viewing, update the status locally immediately
          if (!isOwnMessage && vibeCheck.vibe_check.status !== 'opened') {
            // Update the message in our local state
            setMessages(prev =>
              prev.map(msg => {
                if (msg.id === vibeCheck.id && msg.message_type === 'vibe_check') {
                  return {
                    ...msg,
                    vibe_check: {
                      ...msg.vibe_check!,
                      status: 'opened' as const,
                      opened_at: new Date().toISOString(),
                    },
                  };
                }
                return msg;
              })
            );
          }

          navHelpers.navigateToVibeCheckViewer(vibeCheck.vibe_check);
        }
      }
    },
    [navHelpers, user?.id]
  );

  // Create stable callback ref for VibeCheck press
  const handleVibeCheckPressRef = useRef(handleVibeCheckPress);
  handleVibeCheckPressRef.current = handleVibeCheckPress;

  const renderMessage = useCallback(
    ({ item }: { item: ConversationMessage }) => {
      const isOwnMessage = item.sender_id === user?.id;

      if (item.message_type === 'vibe_check') {
        return (
          <VibeCheckMessageComponent
            message={item as VibeCheckMessage}
            isOwnMessage={isOwnMessage}
            onPress={() => handleVibeCheckPressRef.current(item as VibeCheckMessage)}
          />
        );
      }

      // Render text message
      return <TextMessageComponent message={item as TextMessage} isOwnMessage={isOwnMessage} />;
    },
    [user?.id]
  );

  const renderHeader = useCallback(() => {
    // Show header immediately with loading state
    const otherParticipant = conversation
      ? conversation.participant1_id === user?.id
        ? conversation.participant2
        : conversation.participant1
      : null;

    const displayName = otherParticipant?.username || 'Loading...';
    const avatarLetter = otherParticipant?.username?.charAt(0).toUpperCase() || '?';

    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerAvatarPlaceholder}>
            <Text style={styles.headerAvatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.headerTitle}>{displayName}</Text>
          {loadingConversation && (
            <View style={styles.headerLoading}>
              <Text style={styles.loadingText}>●●●</Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [conversation, user?.id, loadingConversation, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            // Scroll to bottom when content changes
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {loadingMessages ? (
                <Text style={styles.emptyText}>Loading messages...</Text>
              ) : (
                <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
              )}
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.gray}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
    backgroundColor: theme.colors.white,
  },
  headerLoading: {
    marginLeft: 8,
  },
  loadingText: {
    color: theme.colors.gray,
    fontSize: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.black,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  otherMessage: {
    backgroundColor: theme.colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  ownMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.black,
    marginBottom: 4,
  },
  ownMessageText: {
    color: theme.colors.white,
  },
  messageTime: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    backgroundColor: theme.colors.white,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: theme.colors.black,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.lightGray,
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConversationDetailScreen;
