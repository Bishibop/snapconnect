import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchUsers } from '../../services/friends';
import { Profile } from '../../types';
import { theme } from '../../constants/theme';
import { useFriendsContext } from '../../contexts/FriendsContext';
import ActionButton from '../../components/ui/ActionButton';
import FormInput from '../../components/ui/FormInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';

export default function AddFriendsScreen({ navigation }: any) {
  const { sendRequest } = useFriendsContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userProfile: Profile) => {
    setSendingRequests(prev => new Set(prev).add(userProfile.id));

    try {
      const success = await sendRequest(userProfile.id);
      if (success) {
        Alert.alert('Success', `Friend request sent to ${userProfile.username}`);
        // Remove user from search results to prevent duplicate requests
        setSearchResults(prev => prev.filter(u => u.id !== userProfile.id));
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
    } catch (error: unknown) {
      console.error('Error sending friend request:', error);
      Alert.alert(
        'Error',
        (error instanceof Error ? error.message : String(error)) || 'Failed to send friend request'
      );
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userProfile.id);
        return newSet;
      });
    }
  };

  const renderUserItem = ({ item }: { item: Profile }) => {
    const isSending = sendingRequests.has(item.id);

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.joinDate}>
            Joined {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <ActionButton
          title="Add Friend"
          onPress={() => handleSendFriendRequest(item)}
          loading={isSending}
          disabled={isSending}
          variant="primary"
          size="small"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ActionButton
          title="← Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="small"
        />
        <Text style={styles.title}>Add Friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <FormInput
          variant="search"
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" centered />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!loading && searchQuery && searchResults.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No users found"
          subtitle="Try searching for a different username"
        />
      )}

      {!loading && searchQuery === '' && (
        <EmptyState
          icon="👥"
          title="Search for friends"
          subtitle="Enter a username to find and add friends"
        />
      )}

      <RefreshableList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.gray,
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  userInfo: {
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
});
