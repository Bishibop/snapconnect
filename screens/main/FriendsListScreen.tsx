import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendWithProfile } from '../../services/friends';
import { VibeReelWithViewStatus } from '../../services/vibeReels';
import { theme } from '../../constants/theme';
import VibeReelsRow from '../../components/VibeReelsRow';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import ActionButton from '../../components/ui/ActionButton';
import { useFriends } from '../../hooks/useFriends';
import { useVibeReels } from '../../hooks/useVibeReels';
import { useNavigationHelpers, FriendsNavigation } from '../../utils/navigation';
import { formatFriendsSinceDate } from '../../utils/dateTime';

interface FriendsListProps {
  navigation: FriendsNavigation;
}

export default function FriendsListScreen({ navigation }: FriendsListProps) {
  const { friends, refreshing: friendsRefreshing, refresh: refreshFriends, remove } = useFriends();
  const { refreshing: vibeReelsRefreshing, markViewed } = useVibeReels();
  const navHelpers = useNavigationHelpers(navigation);

  const handleCreateVibeReel = () => {
    navHelpers.navigateToCamera();
  };

  const handleViewVibeReel = async (vibeReel: VibeReelWithViewStatus) => {
    // Navigate to VibeReelPlayer
    navigation.navigate('VibeReelPlayer', { vibeReelId: vibeReel.id });
    // Mark as viewed
    await markViewed(vibeReel.id);
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

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader
        title="Friends"
        showLoading={vibeReelsRefreshing}
        rightElement={
          <ActionButton
            title="Add Friends"
            onPress={navHelpers.navigateToAddFriends}
            variant="primary"
            size="small"
          />
        }
      />

      <VibeReelsRow onCreateVibeReel={handleCreateVibeReel} onViewVibeReel={handleViewVibeReel} />

      <View style={styles.requestsContainer}>
        <ActionButton
          title="Friend Requests"
          onPress={navHelpers.navigateToFriendRequests}
          variant="secondary"
          fullWidth
        />
      </View>

      {friends.length === 0 ? (
        <EmptyState
          title="No friends yet"
          subtitle="Add some friends to start sharing VibeChecks!"
        />
      ) : (
        <RefreshableList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          style={styles.list}
          refreshing={friendsRefreshing}
          onRefresh={refreshFriends}
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
});
