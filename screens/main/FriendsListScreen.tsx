import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFriends, removeFriend, FriendWithProfile } from '../../services/friends';
import { Story } from '../../services/stories';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import StoriesRow from '../../components/StoriesRow';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useFriendshipsSubscription } from '../../hooks/useRealtimeSubscription';

export default function FriendsListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  // Real-time subscription for friendship changes
  useFriendshipsSubscription(user?.id, () => {
    loadFriends(); // Refresh friends list
  });

  const handleCreateStory = () => {
    // Navigate to camera to create a story
    navigation.navigate('Camera', { screen: 'CameraScreen' });
  };

  const handleViewStory = (story: Story) => {
    // Navigate to story viewer within Friends stack
    navigation.navigate('SnapViewer', { story });
  };

  const handleRemoveFriend = (friend: FriendWithProfile) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.friend_profile.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friend.id);
              setFriends(prev => prev.filter(f => f.id !== friend.id));
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const renderFriendItem = ({ item }: { item: FriendWithProfile }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <Text style={styles.username}>{item.friend_profile.username}</Text>
        <Text style={styles.joinDate}>
          Friends since {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <ActionButton
        title="Remove"
        onPress={() => handleRemoveFriend(item)}
        variant="danger"
        size="small"
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner centered size="large" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader
        title="Friends"
        rightElement={
          <ActionButton
            title="Add Friends"
            onPress={() => navigation.navigate('AddFriends')}
            variant="primary"
            size="small"
          />
        }
      />

      <StoriesRow onCreateStory={handleCreateStory} onViewStory={handleViewStory} />

      <View style={styles.requestsContainer}>
        <ActionButton
          title="Friend Requests"
          onPress={() => navigation.navigate('FriendRequests')}
          variant="secondary"
          fullWidth
        />
      </View>

      {friends.length === 0 ? (
        <EmptyState title="No friends yet" subtitle="Add some friends to start sharing snaps!" />
      ) : (
        <RefreshableList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          refreshing={refreshing}
          onRefresh={loadFriends}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  requestsContainer: {
    margin: theme.spacing.md,
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
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: theme.colors.gray,
  },
});
