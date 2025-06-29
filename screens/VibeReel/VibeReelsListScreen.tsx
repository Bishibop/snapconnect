import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../../constants/theme';
import { VibeReelWithViewStatus } from '../../services/vibeReels';
import { getArtPieceUrl } from '../../services/artSimilarity';
import { useVibeReels } from '../../hooks/useVibeReels';
import TabHeader from '../../components/TabHeader';
import RefreshableList from '../../components/ui/RefreshableList';
import EmptyState from '../../components/ui/EmptyState';
import { VibeReelsStackParamList } from '../../types';
import { formatTimeAgo } from '../../utils/dateTime';

type VibeReelsListNavigationProp = StackNavigationProp<VibeReelsStackParamList, 'VibeReelsList'>;

interface VibeReelsListProps {
  navigation: VibeReelsListNavigationProp;
}

type FilterTab = 'community' | 'friends' | 'yours';

export default function VibeReelsListScreen({ navigation }: VibeReelsListProps) {
  const { friendVibeReels, myVibeReels, communityVibeReels, refreshing, refresh, markViewed } = useVibeReels();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('community');

  // Calculate unviewed counts
  const unviewedCommunityCount = communityVibeReels.filter(vr => !vr.is_viewed).length;
  const unviewedFriendsCount = friendVibeReels.filter(vr => !vr.is_viewed).length;

  const handleCreateVibeReel = () => {
    navigation.getParent()?.navigate('Camera');
  };

  const handleViewVibeReel = async (vibeReel: VibeReelWithViewStatus) => {
    navigation.navigate('VibeReelPlayer', { vibeReelId: vibeReel.id });
    await markViewed(vibeReel.id);
  };

  // Get the appropriate vibe reels based on active tab
  const getFilteredVibeReels = () => {
    switch (activeFilter) {
      case 'community':
        return communityVibeReels;
      case 'friends':
        return friendVibeReels;
      case 'yours':
        return myVibeReels;
      default:
        return [];
    }
  };

  const filteredVibeReels = getFilteredVibeReels();

  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'community' && styles.filterTabActive]}
        onPress={() => setActiveFilter('community')}
      >
        <Text
          style={[styles.filterTabText, activeFilter === 'community' && styles.filterTabTextActive]}
        >
          Community{unviewedCommunityCount > 0 ? ` (${unviewedCommunityCount})` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'friends' && styles.filterTabActive]}
        onPress={() => setActiveFilter('friends')}
      >
        <Text
          style={[styles.filterTabText, activeFilter === 'friends' && styles.filterTabTextActive]}
        >
          Friends{unviewedFriendsCount > 0 ? ` (${unviewedFriendsCount})` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'yours' && styles.filterTabActive]}
        onPress={() => setActiveFilter('yours')}
      >
        <Text
          style={[styles.filterTabText, activeFilter === 'yours' && styles.filterTabTextActive]}
        >
          Yours
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVibeReelItem = ({ item, index }: { item: VibeReelWithViewStatus; index: number }) => {
    const imageUrl = item.primary_art?.image_url ? getArtPieceUrl(item.primary_art.image_url) : '';

    // Add margin right to left column items (even indices)
    const itemStyle =
      index % 2 === 0 ? [styles.vibeReelItem, styles.vibeReelItemLeft] : styles.vibeReelItem;

    // Add unviewed border style
    const containerStyle = !item.is_viewed ? [itemStyle, styles.unviewedReel] : itemStyle;

    return (
      <TouchableOpacity style={containerStyle} onPress={() => handleViewVibeReel(item)}>
        <Image source={{ uri: imageUrl }} style={styles.vibeReelThumbnail} />
        <View style={styles.vibeReelInfo}>
          <Text style={styles.vibeReelUsername}>@{item.creator?.username || 'unknown'}</Text>
          <View style={styles.vibeReelStats}>
            <Text style={styles.vibeCount}>{item.primary_art?.vibe_count || 0} vibes</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader title="VibeReels" showLoading={refreshing} />

      {renderFilterTabs()}

      {filteredVibeReels.length === 0 ? (
        <EmptyState
          title={
            activeFilter === 'yours'
              ? 'No VibeReels yet'
              : activeFilter === 'community'
              ? 'No community VibeReels'
              : 'No VibeReels to show'
          }
          subtitle={
            activeFilter === 'yours'
              ? 'Create your first VibeReel!'
              : activeFilter === 'community'
              ? 'Be the first to share with the community!'
              : 'Check back later for new VibeReels'
          }
        />
      ) : (
        <RefreshableList
          data={filteredVibeReels}
          renderItem={renderVibeReelItem}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          numColumns={2}
          columnWrapperStyle={filteredVibeReels.length > 1 ? styles.columnWrapper : undefined}
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTab: {
    marginRight: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: theme.colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  vibeReelItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.lightGray,
  },
  vibeReelItemLeft: {
    marginRight: theme.spacing.md, // Add gap between columns
  },
  unviewedReel: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  vibeReelThumbnail: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  vibeReelInfo: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  vibeReelUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  vibeReelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  vibeCount: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: theme.colors.gray,
  },
});
