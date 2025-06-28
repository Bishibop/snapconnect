import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileNavigation } from '../../utils/navigation';
import { ProfileStackParamList, ArtPiece } from '../../types';
import ActionButton from '../../components/ui/ActionButton';
import ArtPieceComponent from '../../components/ArtPiece';
import { getUserArtPieces, getUserVibeReels } from '../../services/vibeReels';
import { ErrorHandler } from '../../utils/errorHandler';

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 48) / 3;

type ProfileScreenRouteProp = RouteProp<ProfileStackParamList, 'ProfileScreen'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigation>();
  const route = useRoute<ProfileScreenRouteProp>();
  const { user } = useAuth();
  const userId = route.params?.userId;
  const profileId = userId || user?.id;
  const { profile, loading } = useProfile(profileId || '');
  const isOwnProfile = !userId || userId === user?.id;

  const [artPieces, setArtPieces] = useState<ArtPiece[]>([]);
  const [loadingArt, setLoadingArt] = useState(true);
  const [_vibeReels, setVibeReels] = useState<any[]>([]);

  useEffect(() => {
    if (profileId) {
      loadUserArt();
    }
  }, [profileId]);

  const loadUserArt = async () => {
    try {
      setLoadingArt(true);
      const [art, reels] = await Promise.all([
        getUserArtPieces(profileId!),
        getUserVibeReels(profileId!),
      ]);
      setArtPieces(art);
      setVibeReels(reels);
    } catch (error) {
      ErrorHandler.handle(error, { context: 'Error loading user art' });
    } finally {
      setLoadingArt(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.username}>{profile.username}</Text>
          {isOwnProfile && (
            <ActionButton
              title="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
              variant="primary"
              size="small"
            />
          )}
        </View>

        <View style={styles.bioSection}>
          <Text style={styles.sectionTitle}>Bio</Text>
          {profile?.bio ? (
            <Text style={styles.bioText}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>
              {isOwnProfile ? 'Add a bio to tell others about yourself and your art' : 'No bio yet'}
            </Text>
          )}
        </View>

        <View style={styles.artSection}>
          <Text style={styles.sectionTitle}>Art Collection</Text>
          {loadingArt ? (
            <View style={styles.artGridPlaceholder}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : artPieces.length === 0 ? (
            <View style={styles.artGridPlaceholder}>
              <Text style={styles.placeholderText}>
                {isOwnProfile
                  ? 'Create your first VibeReel to start your art collection'
                  : 'No art pieces yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.artGrid}>
              {artPieces.map(artPiece => (
                <View key={artPiece.id} style={styles.artPieceWrapper}>
                  <ArtPieceComponent
                    artPiece={artPiece}
                    size={itemSize}
                    showVibeCount={true}
                    showUsername={false}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bioSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  bioText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 22,
  },
  bioPlaceholder: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  artSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  artGridPlaceholder: {
    height: 200,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  artGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  artPieceWrapper: {
    paddingHorizontal: 4,
  },
});
