import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { Snap } from '../../services/snaps';
import { Story } from '../../services/stories';
import StoriesRow from '../../components/StoriesRow';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import SimpleList from '../../components/ui/SimpleList';
import { useSnaps } from '../../hooks/useSnaps';
import { useStories } from '../../hooks/useStories';
import { useNavigationHelpers, SentNavigation } from '../../utils/navigation';
import { formatTimeAgo } from '../../utils/dateTime';
import { getStatusIcon, getStatusColor, getSnapTypeIcon, getEmptyStateIcon } from '../../utils/status';

interface SentSnapsProps {
  navigation: SentNavigation;
}

export default function SentSnapsScreen({ navigation }: SentSnapsProps) {
  const { snaps } = useSnaps({ type: 'sent' });
  const { refreshing } = useStories();
  const navHelpers = useNavigationHelpers(navigation);

  const handleCreateStory = () => {
    navHelpers.navigateToCamera();
  };

  const handleViewStory = (story: Story) => {
    navHelpers.navigateToStoryViewer(story);
  };



  const renderSnapItem = ({ item }: { item: Snap }) => (
    <View style={styles.snapItem}>
      <View style={styles.snapIcon}>
        <Text style={styles.snapIconText}>{getSnapTypeIcon(item.snap_type)}</Text>
      </View>

      <View style={styles.snapContent}>
        <Text style={styles.recipientName}>{item.recipient_profile?.username || 'Unknown'}</Text>
        <Text style={styles.snapDetails}>
          {item.snap_type} • {formatTimeAgo(item.created_at)}
        </Text>
      </View>

      <View style={styles.snapStatus}>
        <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={getEmptyStateIcon('sent')}
      title="No snaps sent yet!"
      subtitle="When you send snaps to friends, you'll see them here with their status"
    />
  );


  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Sent" showLoading={refreshing} />

      <StoriesRow onCreateStory={handleCreateStory} onViewStory={handleViewStory} />

      <SimpleList
        data={snaps}
        renderItem={renderSnapItem}
        keyExtractor={item => item.id}
        style={styles.snapsList}
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
    backgroundColor: theme.colors.lightGray,
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
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  snapDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  snapStatus: {
    alignItems: 'center',
    minWidth: 80,
  },
  statusIcon: {
    fontSize: 16,
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
