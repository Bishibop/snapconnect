import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { VibeCheck } from '../../services/vibeChecks';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import { useVibeChecks } from '../../hooks/useVibeChecks';
import { useNavigationHelpers, InboxNavigation } from '../../utils/navigation';
import { formatTimeAgo } from '../../utils/dateTime';

interface VibeCheckInboxProps {
  navigation: InboxNavigation;
}

export default function VibeCheckInboxScreen({ navigation }: VibeCheckInboxProps) {
  const {
    vibeChecks,
    refreshing: vibeChecksRefreshing,
    refresh: refreshVibeChecks,
  } = useVibeChecks({ type: 'inbox' });
  const navHelpers = useNavigationHelpers(navigation);

  const handleVibeCheckPress = (vibeCheck: VibeCheck) => {
    navHelpers.navigateToVibeCheckViewer(vibeCheck);
  };

  const renderVibeCheckItem = ({ item }: { item: VibeCheck }) => (
    <TouchableOpacity style={styles.vibeCheckItem} onPress={() => handleVibeCheckPress(item)}>
      <View style={styles.vibeCheckContent}>
        <Text style={styles.senderName}>{item.sender_profile?.username || 'Unknown'}</Text>
        <Text style={styles.vibeCheckDetails}>Sent a VibeCheck</Text>
      </View>

      <View style={styles.vibeCheckMeta}>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
        <View style={[styles.statusDot, { backgroundColor: theme.colors.primary }]} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="INBOX_EMPTY"
      title="No VibeChecks yet!"
      subtitle="When friends send you VibeChecks, they'll appear here"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Inbox" showLoading={vibeChecksRefreshing} />

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
  vibeCheckContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vibeCheckDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  vibeCheckMeta: {
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
