import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendWithProfile, FriendRequest } from '../../services/friends';
import { theme } from '../../constants/theme';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useFriends } from '../../hooks/useFriends';
import { useFriendsContext } from '../../contexts/FriendsContext';
import { useNavigationHelpers, FriendsNavigation } from '../../utils/navigation';
import { formatFriendsSinceDate } from '../../utils/dateTime';

interface FriendsListProps {
  navigation: FriendsNavigation;
}

type TabType = 'friends' | 'sent' | 'received';

export default function FriendsListScreen({ navigation }: FriendsListProps) {
  const { friends, refreshing: friendsRefreshing, refresh: refreshFriends, remove } = useFriends();
  const {
    receivedRequests,
    sentRequests,
    loading: requestsLoading,
    acceptRequest,
    declineRequest,
    refreshRequests,
  } = useFriendsContext();
  const navHelpers = useNavigationHelpers(navigation);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleRemoveFriend = (friend: FriendWithProfile) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.friend_profile.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => remove(friend),
        },
      ]
    );
  };

  const handleMessageFriend = (friend: FriendWithProfile) => {
    // Navigate to conversation detail with recipientId
    navigation.getParent()?.navigate('Conversations', {
      screen: 'ConversationDetail',
      params: {
        recipientId: friend.friend_id,
      },
    });
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));

    try {
      const success = await acceptRequest(request.id);
      if (!success) {
        Alert.alert('Error', 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));

    try {
      const success = await declineRequest(request.id);
      if (!success) {
        Alert.alert('Error', 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const renderFriendItem = ({ item }: { item: FriendWithProfile }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => navHelpers.navigateToUserProfile(item.friend_id)}
    >
      <View style={styles.friendInfo}>
        <Text style={styles.username}>{item.friend_profile.username}</Text>
        <Text style={styles.joinDate}>Friends since {formatFriendsSinceDate(item.created_at)}</Text>
      </View>
      <View style={styles.friendActions}>
        <ActionButton
          title="Message"
          onPress={() => handleMessageFriend(item)}
          variant="primary"
          size="small"
        />
        <ActionButton
          title="Remove"
          onPress={() => handleRemoveFriend(item)}
          variant="danger"
          size="small"
        />
      </View>
    </TouchableOpacity>
  );

  const renderReceivedRequest = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingRequests.has(item.id);

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestInfo}>
          <Text style={styles.username}>{item.requester_profile.username}</Text>
          <Text style={styles.requestDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.requestActions}>
          <ActionButton
            title="Accept"
            onPress={() => handleAcceptRequest(item)}
            loading={isProcessing}
            disabled={isProcessing}
            variant="primary"
            size="small"
            style={styles.acceptButton}
          />
          <ActionButton
            title="Decline"
            onPress={() => handleDeclineRequest(item)}
            disabled={isProcessing}
            variant="secondary"
            size="small"
            style={styles.declineButton}
          />
        </View>
      </View>
    );
  };

  const renderSentRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestInfo}>
        <Text style={styles.username}>{item.requester_profile.username}</Text>
        <Text style={styles.requestDate}>
          Sent {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.pendingBadge}>
        <Text style={styles.pendingText}>Pending</Text>
      </View>
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
          Friends ({friends.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
        onPress={() => setActiveTab('sent')}
      >
        <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
          Sent ({sentRequests.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'received' && styles.activeTab]}
        onPress={() => setActiveTab('received')}
      >
        <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
          Received ({receivedRequests.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'friends':
        return friends;
      case 'sent':
        return sentRequests;
      case 'received':
        return receivedRequests;
      default:
        return [];
    }
  };

  const getRenderItem = () => {
    switch (activeTab) {
      case 'friends':
        return renderFriendItem;
      case 'sent':
        return renderSentRequest;
      case 'received':
        return renderReceivedRequest;
      default:
        return renderFriendItem;
    }
  };

  const getEmptyState = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <EmptyState
            title="No friends yet"
            subtitle="Add some friends to start sharing VibeChecks!"
          />
        );
      case 'sent':
        return (
          <EmptyState title="No pending requests" subtitle="Send friend requests to connect" />
        );
      case 'received':
        return <EmptyState title="No friend requests" subtitle="No pending friend requests" />;
      default:
        return null;
    }
  };

  const isLoading = activeTab === 'friends' ? friendsRefreshing : requestsLoading;
  const onRefresh = activeTab === 'friends' ? refreshFriends : refreshRequests;

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader
        title="Friends"
        showLoading={isLoading}
        rightElement={
          <ActionButton
            title="Add Friend"
            onPress={navHelpers.navigateToAddFriends}
            variant="primary"
            size="small"
          />
        }
      />

      {renderFilterTabs()}

      <RefreshableList
        data={getCurrentData()}
        renderItem={getRenderItem()}
        keyExtractor={item => item.id}
        style={styles.list}
        refreshing={isLoading}
        onRefresh={onRefresh}
        ListEmptyComponent={getEmptyState()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  friendInfo: {
    flex: 1,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    color: theme.colors.secondary,
  },
  joinDate: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  requestInfo: {
    flex: 1,
  },
  requestDate: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    minWidth: 80,
  },
  declineButton: {
    minWidth: 80,
  },
  pendingBadge: {
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  pendingText: {
    color: theme.colors.gray,
    fontWeight: '600',
  },
});
