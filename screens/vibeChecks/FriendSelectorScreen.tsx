import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { getFriends, FriendWithProfile } from '../../services/friends';
import { createVibeCheck } from '../../services/vibeChecks';
import { uploadMedia } from '../../services/media';
import { conversationsService } from '../../services/conversations';
import { CameraStackParamList } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RefreshableList from '../../components/ui/RefreshableList';
import ActionButton from '../../components/ui/ActionButton';

type FriendSelectorScreenNavigationProp = StackNavigationProp<
  CameraStackParamList,
  'FriendSelector'
>;
type FriendSelectorScreenRouteProp = RouteProp<CameraStackParamList, 'FriendSelector'>;

interface FriendSelectorProps {
  route: FriendSelectorScreenRouteProp;
  navigation: FriendSelectorScreenNavigationProp;
}

interface SelectableFriend extends FriendWithProfile {
  selected: boolean;
}

export default function FriendSelectorScreen({ route, navigation }: FriendSelectorProps) {
  const { mediaUri, mediaType, filter } = route.params;
  const [friends, setFriends] = useState<SelectableFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      const selectableFriends = friendsList.map(friend => ({
        ...friend,
        selected: false,
      }));
      setFriends(selectableFriends);
    } catch (error: unknown) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendshipId: string) => {
    setFriends(prev =>
      prev.map(friend =>
        friend.id === friendshipId ? { ...friend, selected: !friend.selected } : friend
      )
    );
  };

  const selectedFriends = friends.filter(friend => friend.selected);
  const selectedCount = selectedFriends.length;

  const handleSendVibeCheck = async () => {
    if (selectedCount === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to send to.');
      return;
    }

    setSending(true);

    try {
      // If sending to one friend, navigate immediately for better UX
      if (selectedCount === 1) {
        const friend = selectedFriends[0];

        // Get or create conversation first
        const conversation = await conversationsService.getOrCreateConversation(friend.friend_id);

        // Navigate immediately with pending VibeCheck info
        navigation.popToTop();
        navigation.getParent()?.navigate('Conversations', {
          screen: 'ConversationDetail',
          params: {
            conversationId: conversation.id,
            scrollToBottom: true,
            pendingVibeCheck: {
              localUri: mediaUri,
              mediaType: mediaType,
              filter: filter,
            },
          },
        });

        // Upload and send in the background
        uploadMedia(mediaUri, mediaType)
          .then(uploadResult => {
            return createVibeCheck({
              recipientId: friend.friend_id,
              mediaUrl: uploadResult.path,
              vibeCheckType: mediaType,
              filterType: filter?.id || 'original',
            });
          })
          .then(vibeCheck => {
            return conversationsService.sendVibeCheckMessage(conversation.id, vibeCheck.id);
          })
          .catch(error => {
            console.error('Error sending VibeCheck:', error);
            Alert.alert('Send Failed', 'Failed to send VibeCheck. Please try again.');
          });
      } else {
        // For multiple friends, use the original flow
        const uploadResult = await uploadMedia(mediaUri, mediaType);

        const conversationPromises = selectedFriends.map(async friend => {
          const vibeCheck = await createVibeCheck({
            recipientId: friend.friend_id,
            mediaUrl: uploadResult.path,
            vibeCheckType: mediaType,
            filterType: filter?.id || 'original',
          });

          const conversation = await conversationsService.getOrCreateConversation(friend.friend_id);
          return conversationsService.sendVibeCheckMessage(conversation.id, vibeCheck.id);
        });

        await Promise.all(conversationPromises);

        navigation.popToTop();
        navigation.getParent()?.navigate('Conversations');
      }
    } catch (error: unknown) {
      console.error('Error sending VibeCheck:', error);
      Alert.alert(
        'Send Failed',
        (error instanceof Error ? error.message : String(error)) ||
          'Failed to send VibeCheck. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const renderFriendItem = ({ item }: { item: SelectableFriend }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => toggleFriendSelection(item.id)}>
      <View style={styles.friendInfo}>
        <Text style={styles.friendUsername}>{item.friend_profile.username}</Text>
      </View>
      <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
        {item.selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ActionButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="small"
        />
        <Text style={styles.headerTitle}>Send to...</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Friends List */}
      <View style={styles.content}>
        <RefreshableList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          style={styles.friendsList}
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No friends yet!</Text>
              <Text style={styles.emptySubtext}>Add some friends to start sending VibeChecks</Text>
            </View>
          )}
        />
      </View>

      {/* Send Button */}
      {selectedCount > 0 && (
        <View style={styles.sendContainer}>
          <ActionButton
            title={selectedCount === 1 ? 'Send' : `Send to ${selectedCount} friends`}
            onPress={handleSendVibeCheck}
            loading={sending}
            disabled={sending}
            variant="primary"
            fullWidth
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  friendsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
