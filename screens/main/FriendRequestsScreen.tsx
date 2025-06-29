import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendRequest } from '../../services/friends';
import { theme } from '../../constants/theme';
import { useFriendsContext } from '../../contexts/FriendsContext';
import ActionButton from '../../components/ui/ActionButton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';

type TabType = 'received' | 'sent';

export default function FriendRequestsScreen({ navigation }: any) {
  const {
    receivedRequests,
    sentRequests,
    loading,
    acceptRequest,
    declineRequest,
    refreshRequests,
  } = useFriendsContext();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleAcceptRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));

    try {
      const success = await acceptRequest(request.id);
      if (success) {
        Alert.alert('Success', `You are now friends with ${request.requester_profile.username}`);
      } else {
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

  const currentRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner centered size="large" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ActionButton
          title="← Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="small"
        />
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

      <RefreshableList
        data={currentRequests}
        renderItem={activeTab === 'received' ? renderReceivedRequest : renderSentRequest}
        keyExtractor={item => item.id}
        style={styles.list}
        onRefresh={refreshRequests}
        refreshing={loading}
        ListEmptyComponent={() => (
          <EmptyState
            icon={activeTab === 'received' ? 'FRIENDS_EMPTY' : 'SENT_EMPTY'}
            title={activeTab === 'received' ? 'No friend requests' : 'No pending requests'}
            subtitle={
              activeTab === 'received'
                ? 'Friend requests will appear here'
                : 'Requests you send will appear here'
            }
          />
        )}
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
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: theme.colors.gray,
  },
});
