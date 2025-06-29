import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { VibeCheck } from '../../services/vibeChecks';
import TabHeader from '../../components/TabHeader';
import EmptyState from '../../components/ui/EmptyState';
import RefreshableList from '../../components/ui/RefreshableList';
import StatusIcon from '../../components/ui/StatusIcon';
import { useVibeChecks } from '../../hooks/useVibeChecks';
import { SentNavigation } from '../../utils/navigation';
import { formatTimeAgo } from '../../utils/dateTime';

interface SentVibeChecksProps {
  navigation: SentNavigation;
}

export default function SentVibeChecksScreen({ navigation: _navigation }: SentVibeChecksProps) {
  const {
    vibeChecks,
    refreshing: vibeChecksRefreshing,
    refresh: refreshVibeChecks,
  } = useVibeChecks({ type: 'sent' });

  const renderVibeCheckItem = ({ item }: { item: VibeCheck }) => (
    <View style={styles.vibeCheckItem}>
      <View style={styles.vibeCheckContent}>
        <Text style={styles.recipientName}>{item.recipient_profile?.username || 'Unknown'}</Text>
        <Text style={styles.vibeCheckDetails}>VibeCheck • {formatTimeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.vibeCheckStatus}>
        <StatusIcon status={item.status} size={20} showLabel />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="SENT_EMPTY"
      title="No VibeChecks sent yet!"
      subtitle="When you send VibeChecks to friends, you'll see them here with their status"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="Sent" showLoading={vibeChecksRefreshing} />

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
});
