import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { VibeCheck } from '../../services/vibeChecks';
import { Story } from '../../services/stories';
import StoriesRow from '../../components/StoriesRow';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import { useVibeChecks } from '../../hooks/useVibeChecks';
import { useStories } from '../../hooks/useStories';
import { useNavigationHelpers, SentNavigation } from '../../utils/navigation';
import { formatTimeAgo } from '../../utils/dateTime';
import {
  getStatusIcon,
  getStatusColor,
  getSnapTypeIcon,
  getEmptyStateIcon,
} from '../../utils/status';

interface SentVibeChecksProps {
  navigation: SentNavigation;
}

export default function SentVibeChecksScreen({ navigation }: SentVibeChecksProps) {
  const { vibeChecks, refreshing: vibeChecksRefreshing, refresh: refreshVibeChecks } = useVibeChecks({ type: 'sent' });
  const { refreshing: storiesRefreshing } = useStories();
  const navHelpers = useNavigationHelpers(navigation);

  const handleCreateStory = () => {
    navHelpers.navigateToCamera();
  };

  const handleViewStory = (story: Story) => {
    navHelpers.navigateToStoryViewer(story);
  };

  const renderVibeCheckItem = ({ item }: { item: VibeCheck }) => (
    <View style={styles.vibeCheckItem}>
      <View style={styles.vibeCheckIcon}>
        <Text style={styles.vibeCheckIconText}>{getSnapTypeIcon(item.vibe_check_type)}</Text>
      </View>

      <View style={styles.vibeCheckContent}>
        <Text style={styles.recipientName}>{item.recipient_profile?.username || 'Unknown'}</Text>
        <Text style={styles.vibeCheckDetails}>
          VibeCheck • {formatTimeAgo(item.created_at)}
        </Text>
      </View>

      <View style={styles.vibeCheckStatus}>
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
      title="No VibeChecks sent yet!"
      subtitle="When you send VibeChecks to friends, you'll see them here with their status"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Sent" showLoading={storiesRefreshing} />

      <StoriesRow onCreateStory={handleCreateStory} onViewStory={handleViewStory} />

      <RefreshableList
        data={vibeChecks}
        renderItem={renderVibeCheckItem}
        keyExtractor={item => item.id}
        style={styles.vibeChecksList}
        refreshing={vibeChecksRefreshing}
        onRefresh={refreshVibeChecks}
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
  vibeChecksList: {
    flex: 1,
  },
  vibeCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  vibeCheckIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  vibeCheckIconText: {
    fontSize: 20,
  },
  vibeCheckContent: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vibeCheckDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  vibeCheckStatus: {
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