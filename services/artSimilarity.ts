import { supabase } from '../lib/supabase';

/**
 * Generate CLIP embedding for an art image
 * @param imageUrl - The URL of the image to generate embedding for
 * @returns The 512-dimensional embedding vector
 */
export const generateEmbedding = async (imageUrl: string): Promise<number[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-art-embeddings', {
      body: { artImageUrl: imageUrl },
    });

    if (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }

    if (!data?.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response');
    }

    return data.embedding;
  } catch (error) {
    console.error('Error in generateEmbedding:', error);
    throw error;
  }
};

/**
 * Find similar art pieces using vector similarity search
 * @param embedding - The query embedding vector
 * @param excludeUserId - Optional user ID to exclude from results
 * @param matchThreshold - Minimum similarity threshold (0-1)
 * @param matchCount - Maximum number of results to return
 * @returns Array of similar art pieces with similarity scores
 */
export const findSimilarArt = async (
  embedding: number[],
  excludeUserId?: string,
  matchThreshold = 0.8,
  matchCount = 50
): Promise<
  Array<{
    id: string;
    user_id: string;
    image_url: string;
    vibe_count: number;
    similarity: number;
    created_at: string;
  }>
> => {
  try {
    const { data, error } = await supabase.rpc('find_similar_art', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Error finding similar art:', error);
      throw new Error('Failed to find similar art');
    }

    // Filter out art from excluded user if specified
    let results = data || [];
    if (excludeUserId) {
      results = results.filter((art: any) => art.user_id !== excludeUserId);
    }

    return results;
  } catch (error) {
    console.error('Error in findSimilarArt:', error);
    throw error;
  }
};

/**
 * Create an art piece with its embedding
 * @param userId - The ID of the user creating the art
 * @param imageUrl - The storage URL of the uploaded image
 * @param embedding - The CLIP embedding vector
 * @returns The created art piece
 */
export const createArtPiece = async (userId: string, imageUrl: string, embedding: number[]) => {
  try {
    const { data, error } = await supabase
      .from('art_pieces')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        embedding: embedding,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating art piece:', error);
      throw new Error('Failed to create art piece');
    }

    return data;
  } catch (error) {
    console.error('Error in createArtPiece:', error);
    throw error;
  }
};

/**
 * Get the public URL for an art piece image
 * @param imagePath - The storage path of the image
 * @returns The public URL
 */
export const getArtPieceUrl = (imagePath: string): string => {
  const { data } = supabase.storage.from('art-pieces').getPublicUrl(imagePath);

  return data.publicUrl;
};

/**
 * Upload an art image to storage
 * @param userId - The ID of the user uploading
 * @param file - The image file to upload
 * @returns The storage path of the uploaded file
 */
export const uploadArtImage = async (userId: string, file: File | Blob): Promise<string> => {
  try {
    const fileName = `${userId}/${Date.now()}.jpg`;

    const { data, error } = await supabase.storage.from('art-pieces').upload(fileName, file, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      console.error('Error uploading art image:', error);
      throw new Error('Failed to upload art image');
    }

    return data.path;
  } catch (error) {
    console.error('Error in uploadArtImage:', error);
    throw error;
  }
};
