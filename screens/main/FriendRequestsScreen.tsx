import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  declineFriendRequest,
  FriendRequest,
} from '../../services/friends';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type TabType = 'received' | 'sent';

export default function FriendRequestsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const loadRequests = async () => {
    try {
      const [received, sent] = await Promise.all([
        getPendingRequests(),
        getSentRequests(),
      ]);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Real-time subscription for friend request changes
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('friend-requests-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload) => {
          loadRequests(); // Refresh both lists
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `friend_id=eq.${user.id}` 
        }, 
        (payload) => {
          loadRequests(); // Refresh both lists
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleAcceptRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));
    
    try {
      await acceptFriendRequest(request.id);
      setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
      Alert.alert('Success', `You are now friends with ${request.requester_profile.username}`);
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
      await declineFriendRequest(request.id);
      setReceivedRequests(prev => prev.filter(r => r.id !== request.id));
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

  const renderReceivedRequest = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingRequests.has(item.id);
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.requestInfo}>
          <Text style={styles.username}>{item.requester_profile.username}</Text>
          <Text style={styles.requestDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleAcceptRequest(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleDeclineRequest(item)}
            disabled={isProcessing}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
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

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading requests...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Friend Requests</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received ({receivedRequests.length})
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
      </View>

      {currentRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {activeTab === 'received' ? 'No friend requests' : 'No pending requests'}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'received' 
              ? 'Friend requests will appear here'
              : 'Requests you send will appear here'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentRequests}
          renderItem={activeTab === 'received' ? renderReceivedRequest : renderSentRequest}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadRequests} />
          }
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
    fontSize: 16,
    color: theme.colors.gray,
  },
  activeTabText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
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
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    color: theme.colors.secondary,
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
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  declineButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
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