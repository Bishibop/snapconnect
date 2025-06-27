# Supabase Edge Functions

## Setup

1. Install Supabase CLI if not already installed:

```bash
npm install -g supabase
```

2. Link your project:

```bash
supabase link --project-ref [your-project-ref]
```

3. Set the required environment variables:

```bash
supabase secrets set REPLICATE_API_TOKEN=[your-replicate-api-token]
```

## Deployment

Deploy all functions:

```bash
supabase functions deploy
```

Deploy a specific function:

```bash
supabase functions deploy generate-art-embeddings
```

## Functions

### generate-art-embeddings

Generates CLIP embeddings for art images using the Replicate API.

**Request:**

```json
{
  "artImageUrl": "https://example.com/image.jpg"
}
```

**Response:**

```json
{
  "embedding": [0.1, 0.2, ...], // 512-dimensional vector
  "predictionId": "..."
}
```

## Local Development

To run functions locally:

```bash
supabase functions serve
```

The function will be available at:

```
http://localhost:54321/functions/v1/generate-art-embeddings
```
