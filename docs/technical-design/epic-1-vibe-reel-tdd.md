# Technical Design Document: Epic 1 - VibeReel

## Epic Overview

VibeReel extends the existing SnapConnect ephemeral messaging platform by adding AI-powered art discovery and collaborative visual storytelling. The system leverages existing user authentication, friendship management, and media storage infrastructure while adding semantic art similarity matching, persistent messaging, and profile-based social features.

## Migration from Existing Features

### UI Consolidation

- **Remove Send/Inbox Tabs**: Replace separate Send and Inbox navigation tabs with unified Conversations tab
- **Merge Messaging Interfaces**: Consolidate snap-only messaging UI into new conversation interface supporting both text and VibeChecks
- **Navigation Updates**: Update main tab navigation from 4 tabs (Friends, Camera, Inbox, Send) to 4 tabs (Friends, Camera, Conversations, Profile)

### Terminology Migration

- **Rebrand "Snaps" to "VibeChecks"**: Update all UI strings, variable names, and user-facing text
- **Preserve Data Structure**: Keep existing `snaps` table and functionality, just rebrand the user experience
- **Component Renaming**: Rename snap-related components to use VibeCheck terminology

### Code Cleanup Opportunities

- **Remove Separate Messaging Components**: Clean up old Send/Inbox specific components after conversation interface is complete
- **Consolidate Service Methods**: Merge snap sending/receiving logic into unified conversation service
- **Update Type Definitions**: Rename types from `Message`/`Snap` to `VibeCheck` for clarity

### Database Migration Strategy

- **No Schema Changes**: Existing `snaps` table remains unchanged, only UI references updated
- **Preserve User Data**: All existing snaps become VibeChecks with no data loss
- **Gradual Migration**: Old and new interfaces can coexist during transition period

## Integration Points

### Existing Infrastructure to Leverage

- **`profiles` table**: Extend with bio field for artist profiles
- **`friendships` table**: Use existing bidirectional friend system for profile discovery
- **Supabase Storage**: Extend existing media storage with new buckets for art pieces
- **Supabase Auth**: Continue using existing JWT authentication
- **Supabase Realtime**: Extend existing WebSocket infrastructure for text messaging
- **`snaps` table**: Adapt existing ephemeral messaging system for VibeChecks

### New External Dependencies

- **Replicate API**: Generate CLIP-based vector embeddings for art similarity matching (via Edge Functions)
- **pgvector Extension**: Store and query high-dimensional art embeddings in PostgreSQL
- **React Native Reanimated**: Handle smooth VibeReel video playback transitions

## New Components

### Frontend Components

```
src/
├── screens/
│   ├── VibeReel/
│   │   ├── CreateVibeReel.tsx        # Art capture + similarity browser
│   │   └── VibeReelPlayer.tsx        # Rapid-fire playback
│   ├── Profile/
│   │   ├── ProfileScreen.tsx         # Extended profile with bio + art grid
│   │   ├── EditProfile.tsx           # Bio editing interface
│   │   └── ArtGrid.tsx              # Grid of user's art with Vibes counter
│   └── Conversations/
│       ├── ConversationsList.tsx     # Replaces Send/Inbox tabs
│       ├── ChatScreen.tsx            # Text messages + VibeCheck integration
│       └── VibeCheckViewer.tsx       # 30-second ephemeral viewer
├── components/
│   ├── SimilarArtBrowser.tsx         # Vector similarity art selection
│   ├── VibesCounter.tsx              # Art popularity display
│   └── TextMessage.tsx               # Persistent message component
└── services/
    ├── artSimilarity.ts              # Edge Function calls for embeddings
    ├── vibeReels.ts                  # VibeReel database operations
    └── conversations.ts              # Enhanced messaging service
```

### Backend Extensions

```
supabase/
├── migrations/
│   ├── 008_add_profiles_bio.sql         # Extend profiles table
│   ├── 009_add_art_pieces.sql           # Global art pool with vectors
│   ├── 010_add_vibe_reels.sql           # Collaborative art stories
│   ├── 011_add_conversations.sql        # Persistent messaging
│   ├── 012_add_messages.sql             # Text message table
│   ├── 013_enable_pgvector.sql          # Vector extension + RPC functions
│   └── 014_add_rpc_functions.sql        # Database functions for operations
├── functions/
│   ├── generate-art-embeddings/         # Replicate CLIP API integration
│   └── upload-art-piece/               # Create art piece with embedding
└── storage/
    └── art-pieces/                     # New bucket for shared art
```

## Data Changes

### Table Extensions

#### Extend `profiles` table

```sql
-- Add bio field to existing profiles table
ALTER TABLE profiles ADD COLUMN bio TEXT;
```

### New Database Tables

#### `art_pieces` - Global Art Pool

```sql
CREATE TABLE art_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  embedding VECTOR(512), -- CLIP embedding dimension
  vibe_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX art_pieces_embedding_idx ON art_pieces
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Performance indexes
CREATE INDEX idx_art_pieces_user ON art_pieces(user_id, created_at DESC);
CREATE INDEX idx_art_pieces_popular ON art_pieces(vibe_count DESC, created_at DESC);
```

#### `vibe_reels` - Collaborative Art Stories

```sql
CREATE TABLE vibe_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  primary_art_id UUID REFERENCES art_pieces(id) ON DELETE CASCADE,
  selected_art_ids UUID[] NOT NULL, -- up to 7 pieces
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_vibe_reels_creator ON vibe_reels(creator_id, created_at DESC);
CREATE INDEX idx_vibe_reels_art ON vibe_reels USING GIN(selected_art_ids);
```

#### `conversations` - Persistent Messaging

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[2] NOT NULL, -- exactly 2 participants for MVP
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_activity ON conversations(last_activity DESC);
```

#### `messages` - Text Messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'vibe_check')),
  content TEXT, -- text content or VibeCheck reference
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
```

### Database RPC Functions (via Migrations)

#### Find Similar Art Function

```sql
-- Migration: 014_add_rpc_functions.sql
CREATE OR REPLACE FUNCTION find_similar_art(
  query_embedding vector(512),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  image_url text,
  vibe_count integer,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    art_pieces.id,
    art_pieces.user_id,
    art_pieces.image_url,
    art_pieces.vibe_count,
    1 - (art_pieces.embedding <=> query_embedding) AS similarity,
    art_pieces.created_at
  FROM art_pieces
  WHERE 1 - (art_pieces.embedding <=> query_embedding) > match_threshold
  ORDER BY art_pieces.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### Increment Vibe Count Function

```sql
CREATE OR REPLACE FUNCTION increment_vibe_count(art_piece_id uuid)
RETURNS TABLE (
  id uuid,
  new_vibe_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE art_pieces
  SET vibe_count = vibe_count + 1
  WHERE art_pieces.id = art_piece_id;

  RETURN QUERY
  SELECT art_pieces.id, art_pieces.vibe_count
  FROM art_pieces
  WHERE art_pieces.id = art_piece_id;
END;
$$;
```

#### Update Conversation Activity Function

```sql
CREATE OR REPLACE FUNCTION update_conversation_activity(conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET last_activity = NOW()
  WHERE id = conversation_id;
END;
$$;
```

#### Create or Get Conversation Function

```sql
CREATE OR REPLACE FUNCTION create_or_get_conversation(
  user1_id uuid,
  user2_id uuid
)
RETURNS TABLE (
  id uuid,
  participant_ids uuid[],
  last_activity timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  conversation_exists uuid;
BEGIN
  -- Check if conversation already exists
  SELECT conversations.id INTO conversation_exists
  FROM conversations
  WHERE participant_ids @> ARRAY[user1_id, user2_id]
    AND participant_ids <@ ARRAY[user1_id, user2_id];

  -- If exists, return it
  IF conversation_exists IS NOT NULL THEN
    RETURN QUERY
    SELECT * FROM conversations WHERE conversations.id = conversation_exists;
  ELSE
    -- Create new conversation
    RETURN QUERY
    INSERT INTO conversations (participant_ids)
    VALUES (ARRAY[user1_id, user2_id])
    RETURNING conversations.id, conversations.participant_ids, conversations.last_activity, conversations.created_at;
  END IF;
END;
$$;
```

### Row Level Security Policies

#### Art Pieces (Public Read, Owner Write)

```sql
ALTER TABLE art_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Art pieces are viewable by everyone" ON art_pieces
  FOR SELECT USING (true);

CREATE POLICY "Users can create art via VibeReels" ON art_pieces
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### VibeReels (Public Read, Owner Write)

```sql
ALTER TABLE vibe_reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VibeReels are viewable by everyone" ON vibe_reels
  FOR SELECT USING (true);

CREATE POLICY "Users can create VibeReels" ON vibe_reels
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
```

#### Conversations & Messages (Participants Only)

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants only" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Message participants only" ON messages
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM conversations
      WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS(
      SELECT 1 FROM conversations
      WHERE id = conversation_id AND auth.uid() = ANY(participant_ids)
    )
  );
```

## Database Operations

### Profile Management

```typescript
// Update user bio
await supabase.from('profiles').update({ bio: newBio }).eq('id', userId);

// Get user profile with art pieces
await supabase
  .from('profiles')
  .select(
    `
    *,
    art_pieces:art_pieces(id, image_url, vibe_count, created_at)
  `
  )
  .eq('id', userId)
  .single();
```

### VibeReel Creation

```typescript
// Create new VibeReel (automatically creates art piece)
const { data: vibeReel, error } = await supabase
  .from('vibe_reels')
  .insert({
    creator_id: userId,
    primary_art_id: artPieceId,
    selected_art_ids: selectedArtIds,
  })
  .select()
  .single();

// Increment vibe counts for selected art
for (const artId of selectedArtIds) {
  await supabase.rpc('increment_vibe_count', { art_piece_id: artId });
}

// Browse VibeReels with creator info
await supabase
  .from('vibe_reels')
  .select(
    `
    *,
    creator:profiles(username),
    primary_art:art_pieces(image_url, vibe_count)
  `
  )
  .order('created_at', { ascending: false });
```

### Art Similarity Search

```typescript
// Find similar art using pgvector RPC function
const { data: similarArt, error } = await supabase.rpc('find_similar_art', {
  query_embedding: artEmbedding,
  match_threshold: 0.8,
  match_count: 50,
});
```

### Conversation Management

```typescript
// Create or get existing conversation
const { data: conversation, error } = await supabase.rpc('create_or_get_conversation', {
  user1_id: currentUserId,
  user2_id: friendId,
});

// Get user's conversations with latest message
await supabase
  .from('conversations')
  .select(
    `
    *,
    messages:messages(
      id, sender_id, message_type, content, created_at
    )
  `
  )
  .contains('participant_ids', [userId])
  .order('last_activity', { ascending: false });

// Get paginated messages for a conversation
await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit);

// Send text message and update conversation activity
await supabase.from('messages').insert({
  conversation_id: conversationId,
  sender_id: userId,
  message_type: 'text',
  content: messageText,
});

await supabase.rpc('update_conversation_activity', {
  conversation_id: conversationId,
});
```

## Edge Functions

### Generate Art Embeddings

```typescript
// supabase/functions/generate-art-embeddings/index.ts
export default async function handler(req: Request) {
  const { artImageUrl } = await req.json();

  // Call Replicate CLIP API to generate embedding
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${Deno.env.get('REPLICATE_API_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version:
        'andreasjansson/clip-features:75b33f253f7714a281ad3e9b28f63e3232d583716ef6718f2e46641077ea040a',
      input: { image: artImageUrl },
    }),
  });

  const result = await response.json();
  const embedding = result.output; // 512-dimensional CLIP vector

  return new Response(JSON.stringify({ embedding }));
}
```

### Upload Art Piece

```typescript
// supabase/functions/upload-art-piece/index.ts
export default async function handler(req: Request) {
  const { userId, imageFile } = await req.json();

  // Upload image to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('art-pieces')
    .upload(`${userId}/${Date.now()}.jpg`, imageFile);

  // Generate embedding
  const { embedding } = await generateEmbedding(uploadData.path);

  // Create art piece with embedding
  const { data, error } = await supabase
    .from('art_pieces')
    .insert({
      user_id: userId,
      image_url: uploadData.path,
      embedding: embedding,
    })
    .select()
    .single();

  return new Response(JSON.stringify(data));
}
```

## Enhanced Realtime Subscriptions

### Conversation Updates

```typescript
// Subscribe to new messages in conversation
supabase
  .channel(`conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    handleNewMessage
  )
  .subscribe();
```

### Vibe Count Updates

```typescript
// Subscribe to vibe count changes for user's art
supabase
  .channel(`user-art:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'art_pieces',
      filter: `user_id=eq.${userId}`,
    },
    handleVibeCountUpdate
  )
  .subscribe();
```

### New VibeReels

```typescript
// Subscribe to new VibeReels in global feed
supabase
  .channel('vibe-reels')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'vibe_reels',
    },
    handleNewVibeReel
  )
  .subscribe();
```

## Security Considerations

### Leverage Existing Security Model

- **JWT Authentication**: Continue using existing Supabase Auth tokens
- **RLS Policies**: Extend existing pattern for new tables
- **Storage Buckets**: Create new `art-pieces` bucket with public read access

### New Security Requirements

- **Vector Embeddings**: Store CLIP embeddings server-side only via Edge Functions
- **Replicate API Security**: Secure API token storage in Edge Function environment
- **Art Attribution**: Immutable creator tracking on all art pieces
- **VibeCheck Integration**: Reuse existing `snaps` table policies for ephemeral sharing

### Enhanced Access Control

```sql
-- Art pieces bucket policy
CREATE POLICY "Art pieces public read" ON storage.objects
FOR SELECT USING (bucket_id = 'art-pieces');

CREATE POLICY "Users can create art via VibeReels" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'art-pieces' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Performance Impact

### Leverage Existing Optimizations

- **Database Indexes**: Build on existing friendship and snap indexes
- **Caching Strategy**: Extend existing 5-minute cache for art pieces
- **Realtime Subscriptions**: Use existing selective subscription pattern

### New Performance Requirements

- **Vector Search**: ivfflat indexes for sub-2-second similarity search with 10k art pieces
- **Art Grid Loading**: Pagination for profile art grids
- **Conversation Ordering**: Efficient last_activity sorting for conversation list
- **Message Pagination**: Paginated message loading within conversations for performance

### MVP Performance Targets

- Art similarity search: <2 seconds for 10k pieces (via RPC function)
- VibeReel playback: Smooth transitions using Reanimated
- Message delivery: Leverage existing realtime performance
- Profile loading: <3 seconds including art grid

## Testing Strategy

### Manual Testing Approach

For MVP, focus on manual testing to validate core functionality and user experience.

### Critical User Flows to Test

1. **Complete VibeReel Flow**: Capture art → browse similar → create VibeReel → view result
2. **Enhanced Messaging**: Send text → send VibeCheck → conversation ordering
3. **Profile Discovery**: View friend profile → see art grid → check Vibes counters
4. **Art Pool Growth**: Create VibeReel → art becomes available for others → gets used in VibeReels
5. **CLIP Similarity**: Verify that similar art pieces are being recommended accurately
6. **Navigation Changes**: Test unified Conversations tab replacing Send/Inbox tabs
