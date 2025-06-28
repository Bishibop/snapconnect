import { supabase } from '../lib/supabase';
import { generateEmbedding, uploadArtImage, getArtPieceUrl } from './artSimilarity';
import * as FileSystem from 'expo-file-system';

export interface VibeReel {
  id: string;
  creator_id: string;
  primary_art_id: string;
  selected_art_ids: string[];
  created_at: string;
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

    // Ensure embedding is a flat array of numbers
    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error('Invalid embedding format:', {
        type: typeof embedding,
        isArray: Array.isArray(embedding),
        length: Array.isArray(embedding) ? embedding.length : 'N/A',
        sample: JSON.stringify(embedding).substring(0, 200),
      });
      throw new Error(
        `Invalid embedding: expected array of numbers, got ${Array.isArray(embedding) ? `empty array` : typeof embedding}`
      );
    }
    
    // Log the embedding details
    console.log(`Creating art piece with ${embedding.length}-dimensional embedding`);

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
        creator:profiles(username),
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
        creator:profiles(username),
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
        creator:profiles(username),
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
        user:profiles(username)
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
        creator:profiles(username),
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
