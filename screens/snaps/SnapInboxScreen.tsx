import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { theme } from '../../constants/theme';
import { getInboxSnaps, subscribeToInboxChanges, Snap } from '../../services/snaps';
import { Story } from '../../services/stories';
import { supabase } from '../../lib/supabase';
import StoriesRow from '../../components/StoriesRow';
import TabHeader from '../../components/TabHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import { InboxStackParamList, MainTabParamList } from '../../types';

type SnapInboxScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<InboxStackParamList, 'SnapInbox'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface SnapInboxProps {
  navigation: SnapInboxScreenNavigationProp;
}

export default function SnapInboxScreen({ navigation }: SnapInboxProps) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSnaps();
    setupRealtimeSubscription();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen comes into focus
      if (!loading) {
        loadSnaps();
      }
    }, [loading])
  );

  const loadSnaps = async () => {
    try {
      const snapsList = await getInboxSnaps();
      setSnaps(snapsList);
    } catch (error: unknown) {
      console.error('Error loading snaps:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const subscription = subscribeToInboxChanges(user.id, _payload => {
      loadSnaps(); // Refresh the list when changes occur
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSnaps();
  };

  const handleSnapPress = (snap: Snap) => {
    // Navigate to snap viewer
    navigation.navigate('SnapViewer', {
      snap,
    });
  };

  const handleCreateStory = () => {
    // Navigate to camera to create a story
    navigation.navigate('Camera');
  };

  const handleViewStory = (story: Story) => {
    // Navigate to story viewer (reuse SnapViewer with story data)
    navigation.navigate('SnapViewer', {
      story,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const snapTime = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - snapTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    }
  };

  const getSnapStatusIcon = (snapType: string) => {
    return snapType === 'photo' ? '📸' : '🎥';
  };

  const renderSnapItem = ({ item }: { item: Snap }) => (
    <TouchableOpacity style={styles.snapItem} onPress={() => handleSnapPress(item)}>
      <View style={styles.snapIcon}>
        <Text style={styles.snapIconText}>{getSnapStatusIcon(item.snap_type)}</Text>
      </View>

      <View style={styles.snapContent}>
        <Text style={styles.senderName}>{item.sender_profile?.username || 'Unknown'}</Text>
        <Text style={styles.snapDetails}>Sent a {item.snap_type}</Text>
      </View>

      <View style={styles.snapMeta}>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
        <View style={[styles.statusDot, { backgroundColor: theme.colors.primary }]} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="📥"
      title="No snaps yet!"
      subtitle="When friends send you snaps, they'll appear here"
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TabHeader title="Inbox" />
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading snaps...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Inbox" />

      <StoriesRow onCreateStory={handleCreateStory} onViewStory={handleViewStory} />

      <RefreshableList
        data={snaps}
        renderItem={renderSnapItem}
        keyExtractor={item => item.id}
        style={styles.snapsList}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  snapsList: {
    flex: 1,
  },
  snapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  snapIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  snapIconText: {
    fontSize: 20,
  },
  snapContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  snapDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  snapMeta: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
