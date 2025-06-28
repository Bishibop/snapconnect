import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { artImageUrl } = await req.json();

    if (!artImageUrl) {
      return new Response(JSON.stringify({ error: 'artImageUrl is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Replicate API token from environment
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateToken) {
      console.error('REPLICATE_API_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Replicate CLIP API to generate embeddings
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version:
          'andreasjansson/clip-features:75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a',
        input: {
          inputs: artImageUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Replicate API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to generate embedding' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prediction = await response.json();

    // Poll for completion if needed (Replicate uses async predictions)
    let result = prediction;
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          Authorization: `Token ${replicateToken}`,
        },
      });

      result = await statusResponse.json();
    }

    if (result.status === 'failed') {
      console.error('Prediction failed:', result.error);
      return new Response(JSON.stringify({ error: 'Failed to generate embedding' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the embedding from the result
    // Based on the error, it seems result.output might be nested
    let embedding = result.output;

    // Handle different possible response formats from Replicate
    if (Array.isArray(embedding) && embedding.length === 1 && embedding[0]?.embedding) {
      // Format: [{embedding: [...]}]
      embedding = embedding[0].embedding;
    } else if (embedding?.embedding && Array.isArray(embedding.embedding)) {
      // Format: {embedding: [...]}
      embedding = embedding.embedding;
    }

    // Ensure we have a valid array
    if (!Array.isArray(embedding)) {
      console.error('Unexpected embedding format from Replicate:', result.output);
      throw new Error('Invalid embedding format from Replicate API');
    }

    console.log(`Extracted embedding with ${embedding.length} dimensions`);

    // Return the embedding
    return new Response(
      JSON.stringify({
        embedding: embedding,
        predictionId: result.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-art-embeddings:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
