import * as FileSystem from 'expo-file-system';

const REPLICATE_API_TOKEN = process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN;
const CAPTION_TIMEOUT = 30000; // 30 seconds - increased for model processing
const MAX_CAPTION_LENGTH = 150;

interface ImageData {
  url?: string;
  uri?: string;
  base64?: string;
}

async function imageToBase64(imageData: ImageData): Promise<string> {
  try {
    if (imageData.base64) {
      return imageData.base64;
    }

    if (imageData.uri) {
      // Local file URI - read as base64
      const base64 = await FileSystem.readAsStringAsync(imageData.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }

    if (imageData.url) {
      // Remote URL - download and convert
      const downloadResult = await FileSystem.downloadAsync(
        imageData.url,
        FileSystem.cacheDirectory + 'temp_image.jpg'
      );

      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Clean up temp file
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      return base64;
    }

    throw new Error('No valid image data provided');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

export async function generateVibeCaption(
  userArtUri: string,
  selectedArtUrls: string[]
): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) {
    console.warn('Replicate API token not configured');
    return null;
  }

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Caption generation timeout')), CAPTION_TIMEOUT);
    });

    // Create the caption generation promise
    const captionPromise = generateCaptionInternal(userArtUri, selectedArtUrls);

    // Race between caption generation and timeout
    const result = await Promise.race([captionPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error('Error generating vibe caption:', error);
    return null;
  }
}

async function generateCaptionInternal(
  userArtUri: string,
  selectedArtUrls: string[]
): Promise<string | null> {
  try {
    // Convert user's art to base64
    const userArtBase64 = await imageToBase64({ uri: userArtUri });
    const userArtDataUrl = `data:image/jpeg;base64,${userArtBase64}`;

    // Create context about the collection
    const collectionSize = selectedArtUrls.length + 1;
    const collectionContext =
      selectedArtUrls.length > 0
        ? `This artwork is the centerpiece of a curated collection of ${collectionSize} pieces that share similar vibes and aesthetic qualities. `
        : 'This is a standalone artistic creation. ';

    // Using LLaVA-13B for vision-language understanding
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb',
        input: {
          image: userArtDataUrl,
          prompt: `${collectionContext}Analyze this artwork and write a poetic caption (2-3 short sentences maximum) that captures its emotional essence, mood, and creative vibe. Focus on the feelings it evokes and its artistic spirit. Be evocative and concise.`,
          temperature: 0.8,
          top_p: 0.9,
          max_new_tokens: 100,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Replicate API error details:', errorBody);
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();

    // Poll for completion
    let result = prediction;
    let pollCount = 0;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      pollCount++;

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      console.error('Prediction failed:', result.error);
      console.error('Full result:', JSON.stringify(result, null, 2));
      return null;
    }

    let caption = result.output;

    // Handle array output from some models
    if (Array.isArray(caption)) {
      caption = caption.join('');
    }

    // Clean up the caption
    if (!caption || typeof caption !== 'string') {
      return null;
    }

    // Make it more concise and poetic
    caption = caption.trim();

    // Remove any technical language or instruction remnants
    caption = caption.replace(
      /^(This artwork|This image|This piece|The artwork|The image|It shows|This shows)/i,
      ''
    );
    caption = caption.trim();

    // Ensure caption is within length limit
    if (caption.length > MAX_CAPTION_LENGTH) {
      // Try to cut at a sentence boundary
      const shortened = caption.substring(0, MAX_CAPTION_LENGTH);
      const lastPeriod = shortened.lastIndexOf('.');
      const lastExclamation = shortened.lastIndexOf('!');
      const lastQuestion = shortened.lastIndexOf('?');

      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

      if (lastSentenceEnd > MAX_CAPTION_LENGTH * 0.7) {
        return shortened.substring(0, lastSentenceEnd + 1);
      }

      // Otherwise, cut at word boundary
      const lastSpace = shortened.lastIndexOf(' ');
      return shortened.substring(0, lastSpace) + '...';
    }

    return caption;
  } catch (error) {
    console.error('Error in caption generation:', error);
    return null;
  }
}
