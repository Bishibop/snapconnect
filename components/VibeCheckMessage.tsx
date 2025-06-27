import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../constants/theme';
import { VibeCheckMessage as VibeCheckMessageType } from '../types';
import { supabase } from '../lib/supabase';
import FilteredImage from './FilteredImage';
import { FILTERS } from '../types/filters';
import { formatTimeAgo } from '../utils/dateTime';

const { width: screenWidth } = Dimensions.get('window');
const MESSAGE_MAX_WIDTH = screenWidth * 0.75;

interface VibeCheckMessageProps {
  message: VibeCheckMessageType;
  isOwnMessage: boolean;
  onPress?: () => void;
}

function VibeCheckMessage({
  message,
  isOwnMessage,
  onPress,
}: VibeCheckMessageProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('');

  React.useEffect(() => {
    if (message.vibe_check?.media_url && !mediaUrl) {
      const { data } = supabase.storage.from('media').getPublicUrl(message.vibe_check.media_url);
      setMediaUrl(data.publicUrl);
    }
  }, [message.vibe_check?.media_url, mediaUrl]);

  const handlePress = () => {
    if (onPress && message.vibe_check) {
      onPress();
    }
  };

  if (!message.vibe_check) {
    return (
      <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>VibeCheck unavailable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      <TouchableOpacity style={styles.vibeCheckContainer} onPress={handlePress} disabled={!onPress}>
        {/* VibeCheck Media */}
        <View style={styles.mediaContainer}>
          {!isOwnMessage ? (
            // Recipients see a placeholder
            <View style={[styles.media, styles.mediaPlaceholder]}>
              <Text style={styles.mediaPlaceholderText}>
                {message.vibe_check?.vibe_check_type === 'video' ? '🎥' : '📸'}
              </Text>
              <Text style={styles.placeholderSubtext}>Tap to view</Text>
            </View>
          ) : (
            // Senders see the thumbnail
            mediaUrl ? (
              <FilteredImage
                imageUri={mediaUrl}
                filter={FILTERS.find(f => f.id === message.vibe_check?.filter_type) || FILTERS[0]}
                style={styles.media}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.media, styles.mediaPlaceholder]}>
                <Text style={styles.mediaPlaceholderText}>📸</Text>
              </View>
            )
          )}

          {/* VibeCheck Type Indicator */}
          <View style={styles.typeIndicator}>
            <Text style={styles.typeText}>
              {message.vibe_check?.vibe_check_type === 'video' ? '🎥' : '📸'}
            </Text>
          </View>

          {/* View Timer Indicator for Videos */}
          {message.vibe_check?.vibe_check_type === 'video' && message.vibe_check?.duration && (
            <View style={styles.durationIndicator}>
              <Text style={styles.durationText}>{message.vibe_check.duration}s</Text>
            </View>
          )}
        </View>

        {/* Message Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.vibeCheckLabel}>VibeCheck</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(message.created_at)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  vibeCheckContainer: {
    maxWidth: MESSAGE_MAX_WIDTH,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaContainer: {
    position: 'relative',
    width: 200,
    height: 200,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  mediaPlaceholderText: {
    fontSize: 40,
    opacity: 0.5,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    opacity: 0.7,
  },
  typeIndicator: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
  },
  durationIndicator: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  durationText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  metadata: {
    padding: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vibeCheckLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.md,
    maxWidth: MESSAGE_MAX_WIDTH,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default memo(VibeCheckMessage, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.isOwnMessage === nextProps.isOwnMessage &&
    prevProps.message.vibe_check?.status === nextProps.message.vibe_check?.status
  );
});