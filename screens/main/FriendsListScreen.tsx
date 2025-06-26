import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFriends, removeFriend, FriendWithProfile } from '../../services/friends';
import { Story } from '../../services/stories';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StoriesRow from '../../components/StoriesRow';
import TabHeader from '../../components/TabHeader';

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
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${user.id}`,
        },
        _payload => {
          loadFriends(); // Refresh friends list
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${user.id}`,
        },
        _payload => {
          loadFriends(); // Refresh friends list
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

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
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFriend(item)}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading friends...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader
        title="Friends"
        rightElement={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddFriends')}
          >
            <Text style={styles.addButtonText}>Add Friends</Text>
          </TouchableOpacity>
        }
      />

      <StoriesRow onCreateStory={handleCreateStory} onViewStory={handleViewStory} />

      <TouchableOpacity
        style={styles.requestsButton}
        onPress={() => navigation.navigate('FriendRequests')}
      >
        <Text style={styles.requestsButtonText}>Friend Requests</Text>
      </TouchableOpacity>

      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>Add some friends to start sharing snaps!</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFriends} />}
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
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  addButtonText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  requestsButton: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  requestsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
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
  removeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  removeButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: theme.colors.gray,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.secondary,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
  },
});
