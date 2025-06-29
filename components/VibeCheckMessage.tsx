import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../constants/theme';
import { VibeCheckMessage as VibeCheckMessageType } from '../types';
import { supabase } from '../lib/supabase';
import FilteredImage from './FilteredImage';
import { FILTERS } from '../types/filters';
import { formatTimeAgo } from '../utils/dateTime';
import Icon from './ui/Icon';

const { width: screenWidth } = Dimensions.get('window');
const MESSAGE_MAX_WIDTH = screenWidth * 0.5;

interface VibeCheckMessageProps {
  message: VibeCheckMessageType;
  isOwnMessage: boolean;
  onPress?: () => void;
}

function VibeCheckMessage({ message, isOwnMessage, onPress }: VibeCheckMessageProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('');

  // Simplified display logic for recipients
  const isViewed = message.vibe_check?.status === 'opened';
  const canView = isOwnMessage || !isViewed;

  // Display values for recipients
  const displayText = isViewed ? 'Already viewed' : 'Tap to view';

  React.useEffect(() => {
    if (message.vibe_check?.media_url && !mediaUrl) {
      const { data } = supabase.storage.from('media').getPublicUrl(message.vibe_check.media_url);
      setMediaUrl(data.publicUrl);
    }
  }, [message.vibe_check?.media_url, mediaUrl]);

  const handlePress = () => {
    if (onPress && message.vibe_check && canView) {
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
      <TouchableOpacity
        style={[
          styles.vibeCheckContainer,
          !isOwnMessage && !isViewed && styles.vibeCheckContainerUnopened,
        ]}
        onPress={handlePress}
        disabled={!onPress || !canView}
      >
        {/* VibeCheck Media */}
        <View style={styles.mediaContainer}>
          {!isOwnMessage ? (
            // Recipients see a placeholder
            <View
              style={[
                styles.media,
                styles.mediaPlaceholder,
                isViewed && styles.mediaPlaceholderOpened,
              ]}
            >
              <View style={styles.mediaPlaceholderIcon}>
                <Icon
                  name={isViewed ? 'CLOSED' : 'OPENED'}
                  size={30}
                  color={isViewed ? theme.colors.gray : theme.colors.primary}
                />
              </View>
              <Text style={styles.placeholderSubtext}>{displayText}</Text>
              <View style={[styles.timestampOverlay, styles.timestampOverlayViewed]}>
                <Text style={[styles.timestampOverlayText, styles.timestampViewedText]}>
                  {formatTimeAgo(message.created_at)}
                </Text>
              </View>
            </View>
          ) : // Senders see the thumbnail
          mediaUrl ? (
            <View style={styles.media}>
              <FilteredImage
                imageUri={mediaUrl}
                filter={FILTERS.find(f => f.id === message.vibe_check?.filter_type) || FILTERS[0]}
                style={styles.media}
                resizeMode="cover"
              />
              <View style={styles.timestampOverlay}>
                <Text style={styles.timestampOverlayText}>{formatTimeAgo(message.created_at)}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.media, styles.mediaPlaceholder]}>
              <View style={styles.timestampOverlay}>
                <Text style={styles.timestampOverlayText}>{formatTimeAgo(message.created_at)}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
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
  vibeCheckContainerUnopened: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  mediaContainer: {
    position: 'relative',
    width: 150,
    height: 150,
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
  mediaPlaceholderOpened: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  mediaPlaceholderIcon: {
    marginBottom: theme.spacing.xs,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    opacity: 0.7,
  },
  timestampOverlay: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  timestampOverlayViewed: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  timestampOverlayText: {
    fontSize: 11,
    color: theme.colors.white,
  },
  timestampViewedText: {
    color: theme.colors.textSecondary,
    opacity: 0.7,
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
