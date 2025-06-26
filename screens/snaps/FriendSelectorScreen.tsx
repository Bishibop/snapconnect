import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { getFriends, FriendWithProfile } from '../../services/friends';
import { createSnap } from '../../services/snaps';
import { uploadMedia } from '../../services/media';
import { Filter } from '../../types/filters';
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
  route: FriendSelectorScreenRouteProp & {
    params: {
      mediaUri: string;
      mediaType: 'photo' | 'video';
      filter?: Filter;
    };
  };
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

  const handleSendSnap = async () => {
    if (selectedCount === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to send the snap to.');
      return;
    }

    setSending(true);

    try {
      // First upload the media
      const uploadResult = await uploadMedia(mediaUri, mediaType);

      // Create snaps for each selected friend
      const snapPromises = selectedFriends.map(friend =>
        createSnap({
          recipientId: friend.friend_id, // Use the friend's profile ID, not the friendship ID
          mediaUrl: uploadResult.path, // Use the storage path, not the public URL
          snapType: mediaType,
          filterType: filter?.id || 'original',
        })
      );

      await Promise.all(snapPromises);

      Alert.alert(
        'Snap Sent!',
        `Successfully sent ${mediaType} to ${selectedCount} friend${selectedCount > 1 ? 's' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('CameraScreen');
            },
          },
        ]
      );
    } catch (error: unknown) {
      console.error('Error sending snap:', error);
      Alert.alert(
        'Send Failed',
        (error instanceof Error ? error.message : String(error)) ||
          'Failed to send snap. Please try again.'
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
          variant="secondary"
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
              <Text style={styles.emptySubtext}>Add some friends to start sending snaps</Text>
            </View>
          )}
        />
      </View>

      {/* Send Button */}
      {selectedCount > 0 && (
        <View style={styles.sendContainer}>
          <ActionButton
            title={selectedCount === 1 ? 'Send' : `Send to ${selectedCount} friends`}
            onPress={handleSendSnap}
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
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
