import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchUsers, sendFriendRequest } from '../../services/friends';
import { Profile } from '../../types';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AddFriendsScreen({ navigation }: any) {
  const { user } = useAuth();
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

  // Real-time subscription for sent friend requests feedback
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('add-friends-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'friendships',
          filter: `requested_by=eq.${user.id}` 
        }, 
        (payload) => {
          // Could show a toast notification here
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleSendFriendRequest = async (userProfile: Profile) => {
    setSendingRequests(prev => new Set(prev).add(userProfile.id));
    
    try {
      await sendFriendRequest(userProfile.id);
      Alert.alert('Success', `Friend request sent to ${userProfile.username}`);
      // Remove user from search results to prevent duplicate requests
      setSearchResults(prev => prev.filter(u => u.id !== userProfile.id));
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', error.message || 'Failed to send friend request');
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
        <TouchableOpacity
          style={[styles.addButton, isSending && styles.addButtonDisabled]}
          onPress={() => handleSendFriendRequest(item)}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.colors.secondary} />
          ) : (
            <Text style={styles.addButtonText}>Add Friend</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!loading && searchQuery && searchResults.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try searching for a different username</Text>
        </View>
      )}

      {!loading && searchQuery === '' && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Search for friends</Text>
          <Text style={styles.emptySubtext}>Enter a username to find and add friends</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
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
  backButton: {
    marginRight: theme.spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    fontSize: 16,
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
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: theme.colors.secondary,
    fontWeight: '600',
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