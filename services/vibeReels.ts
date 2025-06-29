import { supabase } from '../lib/supabase';
import { generateEmbedding, uploadArtImage, getArtPieceUrl } from './artSimilarity';
import * as FileSystem from 'expo-file-system';

export interface VibeReel {
  id: string;
  creator_id: string;
  primary_art_id: string;
  selected_art_ids: string[];
  created_at: string;
  posted_at?: string | null;
  creator?: {
    username: string;
  };
  primary_art?: {
    image_url: string;
    vibe_count: number;
  };
}

export interface VibeReelWithArt extends VibeReel {
  selected_art: Array<{
    id: string;
    image_url: string;
    user_id: string;
    vibe_count: number;
    user?: {
      username: string;
    };
  }>;
}

export const createVibeReel = async (
  imageFile: File | string,
  selectedArtIds: string[]
): Promise<VibeReel> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // 1. For React Native, we need to handle file upload properly
    let imageUrl: string;

    if (typeof imageFile === 'string') {
      // It's a URI, use FileSystem API
      const fileInfo = await FileSystem.getInfoAsync(imageFile);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageFile, {
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

      if (uploadError) throw uploadError;
      imageUrl = uploadData.path;
    } else {
      // It's already a File/Blob, use existing upload function
      imageUrl = await uploadArtImage(user.id, imageFile);
    }

    // 2. Generate CLIP embedding
    const publicUrl = getArtPieceUrl(imageUrl);
    const embedding = await generateEmbedding(publicUrl);

    // Ensure embedding is a flat array of 768 numbers (CLIP model output)
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      console.error('Invalid embedding format:', {
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        length: Array.isArray(embedding) ? embedding.length : 'N/A',
        expected: 768,
      });
      throw new Error(
        `Invalid embedding: expected 768-dimensional array, got ${Array.isArray(embedding) ? `${embedding.length}-dimensional array` : typeof embedding}`
      );
    }

    // 3. Create art_piece record
    const { data: artPiece, error: artError } = await supabase
      .from('art_pieces')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        embedding: embedding,
      })
      .select()
      .single();

    if (artError) throw artError;

    // 4. Create vibe_reel record
    const { data: vibeReel, error: vibeReelError } = await supabase
      .from('vibe_reels')
      .insert({
        creator_id: user.id,
        primary_art_id: artPiece.id,
        selected_art_ids: selectedArtIds,
      })
      .select(
        `
        *,
        creator:profiles!vibe_reels_creator_id_fkey(username),
        primary_art:art_pieces(image_url, vibe_count)
      `
      )
      .single();

    if (vibeReelError) throw vibeReelError;

    // 5. Increment vibe counts for selected art
    for (const artId of selectedArtIds) {
      await supabase.rpc('increment_vibe_count', { art_piece_id: artId });
    }

    return vibeReel;
  } catch (error) {
    console.error('Error creating VibeReel:', error);
    throw error;
  }
};

export const getUserVibeReels = async (userId: string): Promise<VibeReel[]> => {
  try {
    const { data, error } = await supabase
      .from('vibe_reels')
      .select(
        `
        *,
        creator:profiles!vibe_reels_creator_id_fkey(username),
        primary_art:art_pieces(image_url, vibe_count)
      `
      )
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user VibeReels:', error);
    throw error;
  }
};

export const getVibeReelWithArt = async (vibeReelId: string): Promise<VibeReelWithArt | null> => {
  try {
    // Get the vibe reel
    const { data: vibeReel, error: vibeReelError } = await supabase
      .from('vibe_reels')
      .select(
        `
        *,
        creator:profiles!vibe_reels_creator_id_fkey(username),
        primary_art:art_pieces(image_url, vibe_count)
      `
      )
      .eq('id', vibeReelId)
      .single();

    if (vibeReelError) throw vibeReelError;
    if (!vibeReel) return null;

    // Get all selected art pieces with their creators
    const { data: selectedArt, error: artError } = await supabase
      .from('art_pieces')
      .select(
        `
        *,
        user:profiles!art_pieces_user_id_fkey(username)
      `
      )
      .in('id', vibeReel.selected_art_ids);

    if (artError) throw artError;

    // Sort selected art to match the order in selected_art_ids
    const sortedArt = vibeReel.selected_art_ids
      .map((id: string) => selectedArt?.find(art => art.id === id))
      .filter(Boolean);

    return {
      ...vibeReel,
      selected_art: sortedArt || [],
    };
  } catch (error) {
    console.error('Error fetching VibeReel with art:', error);
    throw error;
  }
};

export const getUserArtPieces = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('art_pieces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user art pieces:', error);
    throw error;
  }
};

export const getAllVibeReels = async (limit = 20): Promise<VibeReel[]> => {
  try {
    const { data, error } = await supabase
      .from('vibe_reels')
      .select(
        `
        *,
        creator:profiles!vibe_reels_creator_id_fkey(username),
        primary_art:art_pieces(image_url, vibe_count)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all VibeReels:', error);
    throw error;
  }
};

// Post a VibeReel to make it visible to friends
export const postVibeReel = async (vibeReelId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const postedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from('vibe_reels')
    .update({ posted_at: postedAt })
    .eq('id', vibeReelId)
    .eq('creator_id', user.id) // Ensure user can only post their own VibeReels
    .select();

  if (error) {
    console.error('[postVibeReel] Error posting VibeReel:', error);
    throw new Error('Failed to post VibeReel');
  }
};

// Get posted VibeReels from friends with view status
export const getPostedVibeReelsFromFriends = async (): Promise<VibeReelWithViewStatus[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get friend IDs
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  if (friendError) {
    console.error('Error fetching friends:', friendError);
    throw new Error('Failed to fetch friends');
  }

  const friendIds = friendships?.map(f => f.friend_id) || [];

  if (friendIds.length === 0) {
    return [];
  }

  // Get all posted VibeReels from friends
  const { data: vibeReels, error } = await supabase
    .from('vibe_reels')
    .select(
      `
      *,
      creator:profiles!vibe_reels_creator_id_fkey(username),
      primary_art:art_pieces(image_url, vibe_count),
      vibe_reel_views(viewer_id)
    `
    )
    .in('creator_id', friendIds)
    .not('posted_at', 'is', null)
    .order('posted_at', { ascending: false });

  if (error) {
    console.error('Error fetching friend VibeReels:', error);
    throw new Error('Failed to fetch friend VibeReels');
  }

  // Add view status to each VibeReel (no deduplication - show all reels)
  const vibeReelsWithViewStatus = (vibeReels || []).map(vibeReel => ({
    ...vibeReel,
    is_viewed:
      vibeReel.vibe_reel_views?.some((view: { viewer_id: string }) => view.viewer_id === user.id) ||
      false,
  }));

  return vibeReelsWithViewStatus;
};

// Get all current user's posted VibeReels
export const getCurrentUserPostedVibeReels = async (): Promise<VibeReel[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('vibe_reels')
    .select(
      `
      *,
      creator:profiles!vibe_reels_creator_id_fkey(username),
      primary_art:art_pieces(image_url, vibe_count)
    `
    )
    .eq('creator_id', user.id)
    .not('posted_at', 'is', null)
    .order('posted_at', { ascending: false });

  if (error) {
    console.error('Error fetching user VibeReels:', error);
    throw new Error('Failed to fetch user VibeReels');
  }

  return data || [];
};

// Get current user's most recent posted VibeReel (for compatibility)
export const getCurrentUserPostedVibeReel = async (): Promise<VibeReel | null> => {
  const vibeReels = await getCurrentUserPostedVibeReels();
  return vibeReels.length > 0 ? vibeReels[0] : null;
};

// Mark a VibeReel as viewed
export const markVibeReelViewed = async (vibeReelId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if already viewed
  const { data: existingView } = await supabase
    .from('vibe_reel_views')
    .select('vibe_reel_id')
    .eq('vibe_reel_id', vibeReelId)
    .eq('viewer_id', user.id)
    .single();

  // Only insert if not already viewed
  if (!existingView) {
    const { error } = await supabase.from('vibe_reel_views').insert({
      vibe_reel_id: vibeReelId,
      viewer_id: user.id,
    });

    if (error) {
      console.error('Error marking VibeReel as viewed:', error);
      throw new Error('Failed to mark VibeReel as viewed');
    }
  }
};

// Types for VibeReels with view status
export interface VibeReelWithViewStatus extends VibeReel {
  is_viewed: boolean;
  is_own_vibe_reel?: boolean;
}
