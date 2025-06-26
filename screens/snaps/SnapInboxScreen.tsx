import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { Snap } from '../../services/snaps';
import { Story } from '../../services/stories';
import StoriesRow from '../../components/StoriesRow';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import { useSnaps } from '../../hooks/useSnaps';
import { useStories } from '../../hooks/useStories';
import { useNavigationHelpers, InboxNavigation } from '../../utils/navigation';
import { formatTimeAgo } from '../../utils/dateTime';
import { getSnapTypeIcon, getEmptyStateIcon } from '../../utils/status';

interface SnapInboxProps {
  navigation: InboxNavigation;
}

export default function SnapInboxScreen({ navigation }: SnapInboxProps) {
  const { snaps, refreshing: snapsRefreshing, refresh: refreshSnaps } = useSnaps({ type: 'inbox' });
  const { refreshing: storiesRefreshing } = useStories();
  const navHelpers = useNavigationHelpers(navigation);

  const handleSnapPress = (snap: Snap) => {
    navHelpers.navigateToSnapViewer(snap);
  };

  const handleCreateStory = () => {
    navHelpers.navigateToCamera();
  };

  const handleViewStory = (story: Story) => {
    navHelpers.navigateToStoryViewer(story);
  };



  const renderSnapItem = ({ item }: { item: Snap }) => (
    <TouchableOpacity style={styles.snapItem} onPress={() => handleSnapPress(item)}>
      <View style={styles.snapIcon}>
        <Text style={styles.snapIconText}>{getSnapTypeIcon(item.snap_type)}</Text>
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
      icon={getEmptyStateIcon('inbox')}
      title="No snaps yet!"
      subtitle="When friends send you snaps, they'll appear here"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Inbox" showLoading={storiesRefreshing} />

      <StoriesRow onCreateStory={handleCreateStory} onViewStory={handleViewStory} />

      <RefreshableList
        data={snaps}
        renderItem={renderSnapItem}
        keyExtractor={item => item.id}
        style={styles.snapsList}
        refreshing={snapsRefreshing}
        onRefresh={refreshSnaps}
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
