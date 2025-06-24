import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';

export interface UploadResult {
  url: string;
  path: string;
}

// Generate a unique filename for the media
const generateFileName = (mediaType: 'photo' | 'video'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = mediaType === 'photo' ? 'jpg' : 'mp4';
  return `${mediaType}s/${timestamp}_${random}.${extension}`;
};

// Upload media file to Supabase Storage
export async function uploadMedia(
  mediaUri: string, 
  mediaType: 'photo' | 'video'
): Promise<UploadResult> {
  try {
    console.log('Starting media upload:', mediaUri);
    
    // Read the file as base64
    const fileInfo = await FileSystem.getInfoAsync(mediaUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    console.log('File info:', fileInfo);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(mediaUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const fileName = generateFileName(mediaType);
    console.log('Generated filename:', fileName);

    // Convert base64 to blob for upload
    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('media') // Make sure this bucket exists
      .upload(fileName, arrayBuffer, {
        contentType: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
    };

  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// Delete media file from Supabase Storage
export async function deleteMedia(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('Media deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

// Get a signed URL for private media (if needed later)
export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
}