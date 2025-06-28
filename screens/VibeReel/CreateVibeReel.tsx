import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { findSimilarArt, generateEmbedding, getArtPieceUrl } from '../../services/artSimilarity';
import { createVibeReel } from '../../services/vibeReels';
import { supabase } from '../../lib/supabase';
import { theme } from '../../constants/theme';
import { ErrorHandler } from '../../utils/errorHandler';
import ActionButton from '../../components/ui/ActionButton';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 48) / 3; // 3 columns with padding

interface SimilarArt {
  id: string;
  image_url: string;
  similarity: number;
  user_id: string;
  vibe_count: number;
  user?: {
    username: string;
  };
}

export default function CreateVibeReel() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { imageUri, imageFile } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [similarArt, setSimilarArt] = useState<SimilarArt[]>([]);
  const [selectedArt, setSelectedArt] = useState<string[]>([]);
  const [_userArtEmbedding, setUserArtEmbedding] = useState<number[]>([]);

  useEffect(() => {
    if (imageUri || imageFile) {
      loadSimilarArt();
    } else {
      Alert.alert('Error', 'No image provided');
      navigation.goBack();
    }
  }, []);

  const loadSimilarArt = async () => {
    try {
      setLoading(true);

      // Generate embedding for the user's art
      // Convert URI to blob/file if needed
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // For React Native, convert URI to blob with proper error handling
      let imageUrl: string;
      let publicUrl: string;

      try {
        // Read the file as base64 (following the media service pattern)
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to Uint8Array for upload
        const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

        // Generate unique filename
        const fileName = `${user.id}/${Date.now()}.jpg`;

        // Upload to Supabase Storage (art-pieces bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('art-pieces')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        imageUrl = uploadData.path;
        publicUrl = getArtPieceUrl(imageUrl);
        // Image uploaded successfully
      } catch (uploadError) {
        console.error('Error during image upload:', uploadError);
        throw new Error(
          `Failed to upload image: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`
        );
      }

      const embedding = await generateEmbedding(publicUrl);
      setUserArtEmbedding(embedding);

      // Find similar art - lower threshold since we might not have many art pieces yet
      let similar: SimilarArt[] = [];
      try {
        // Exclude the current user's own art from results
        const foundArt = await findSimilarArt(embedding, user.id, 0.3, 50);
        similar = foundArt as SimilarArt[];
      } catch (error) {
        console.warn('No similar art found, this might be the first art piece');
        // Continue with empty similar art array
      }

      // Get user info for each art piece
      const artWithUsers = await Promise.all(
        similar.map(async art => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', art.user_id)
            .single();

          return {
            ...art,
            user: userData || undefined,
          };
        })
      );

      setSimilarArt(artWithUsers);
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error finding similar art' });
    } finally {
      setLoading(false);
    }
  };

  const toggleArtSelection = (artId: string) => {
    setSelectedArt(prev => {
      if (prev.includes(artId)) {
        return prev.filter(id => id !== artId);
      }
      if (prev.length >= 7) {
        Alert.alert('Limit Reached', 'You can select up to 7 art pieces');
        return prev;
      }
      return [...prev, artId];
    });
  };

  const handleCreateVibeReel = async () => {
    // Allow creating VibeReel with just the user's art if no similar art exists
    if (selectedArt.length === 0 && similarArt.length > 0) {
      Alert.alert('No Art Selected', 'Please select at least one art piece');
      return;
    }

    try {
      setCreating(true);

      const vibeReel = await createVibeReel(imageUri, selectedArt);

      // Navigate to the VibeReel preview
      navigation.replace('VibeReelPreview', { vibeReelId: vibeReel.id });
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error creating VibeReel' });
    } finally {
      setCreating(false);
    }
  };

  const renderArtItem = ({ item }: { item: SimilarArt }) => {
    const isSelected = selectedArt.includes(item.id);
    const selectedIndex = selectedArt.indexOf(item.id);
    const imageUrl = getArtPieceUrl(item.image_url);

    return (
      <TouchableOpacity
        style={[styles.artItem, isSelected && styles.selectedArt]}
        onPress={() => toggleArtSelection(item.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: imageUrl }} style={styles.artImage} />
        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionNumber}>{selectedIndex + 1}</Text>
          </View>
        )}
        <View style={styles.artInfo}>
          <Text style={styles.username} numberOfLines={1}>
            @{item.user?.username || 'unknown'}
          </Text>
          <Text style={styles.vibeCount}>{item.vibe_count} vibes</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Finding similar art...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Similar Art</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>
        {similarArt.length > 0
          ? `Choose up to 7 pieces that vibe with your art (${selectedArt.length}/7)`
          : "You're creating the first art piece! Your VibeReel will feature just your art."}
      </Text>

      {similarArt.length > 0 ? (
        <FlatList
          data={similarArt}
          renderItem={renderArtItem}
          keyExtractor={item => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No similar art found yet. Be the pioneer!</Text>
          <Text style={styles.emptyStateSubtext}>
            Your art will be available for others to vibe with.
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <ActionButton
          title={
            similarArt.length === 0
              ? 'Create Solo VibeReel'
              : `Create VibeReel (${selectedArt.length} selected)`
          }
          onPress={handleCreateVibeReel}
          disabled={selectedArt.length === 0 && similarArt.length > 0}
          loading={creating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 60,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  artItem: {
    width: itemSize,
    height: itemSize,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.lightGray,
  },
  selectedArt: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  selectionBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  artInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  username: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  vibeCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
