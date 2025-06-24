import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FriendWithProfile } from '../../services/friends';
import { theme } from '../../constants/theme';

interface FriendItemProps {
  friend: FriendWithProfile;
  onRemove?: (friend: FriendWithProfile) => void;
  onPress?: (friend: FriendWithProfile) => void;
  showRemoveButton?: boolean;
}

export default function FriendItem({ 
  friend, 
  onRemove, 
  onPress, 
  showRemoveButton = true 
}: FriendItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(friend)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.friendInfo}>
        <Text style={styles.username}>{friend.friend_profile.username}</Text>
        <Text style={styles.joinDate}>
          Friends since {new Date(friend.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      {showRemoveButton && onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(friend)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  friendInfo: {
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
  removeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  removeButtonText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
});