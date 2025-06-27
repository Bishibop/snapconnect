# Implementation Plan: Epic 1 - VibeReel

## Epic Overview

Transform SnapConnect from ephemeral messaging to an artist social network with collaborative visual storytelling through VibeReels, semantic art similarity, enhanced messaging, and artist profiles.

## Supporting Documents

- **Epic Brief**: `/docs/epic-briefs/epic-1-vibe-reel.md`
- **Technical Design**: `/docs/technical-design/epic-1-vibe-reel-tdd.md`
- **System Architecture**: `/docs/architecture/system-architecture.md`

## Epic Implementation Guide

**General Workflow for Epic Implementation:**

- **Kickoff** - Read the supporting documents listed above, review epic requirements with user, confirm overall approach
- **Implementation** - Work through features sequentially using the Feature Implementation Guide
- **Completion** - Present completed epic to user, prompt user to verify against epic brief requirements, update system architecture document based on actual implementation, prompt user to do epic retrospective, get sign-off on the complete implementation

## Feature Implementation Guide

**General Workflow for Each Feature:**

- **Kickoff** - Review feature requirements with user, ask clarifying questions about preferences and approach
- **Implementation** - Build the entire feature independently, making reasonable technical decisions
- **Completion** - Present completed feature to user, prompt user to verify against feature requirements, get sign-off before proceeding

## Feature 1: Profile Bio Extension

### Overview

Add bio text functionality to user profiles, enabling artists to describe themselves and their work.

### User Experience

Users can edit their bio on their profile and view friends' bios when visiting their profiles.

### Technical Implementation

#### Database Changes

```sql
-- Migration: 008_add_profiles_bio.sql
ALTER TABLE profiles ADD COLUMN bio TEXT;
```

#### Frontend Development

1. **Create Profile screens**

   ```typescript
   src/screens/Profile/
   ├── ProfileScreen.tsx     # Main profile view with bio display
   └── EditProfile.tsx       # Bio editing interface
   ```

2. **Extend profiles service**

   ```typescript
   // services/profiles.ts (new file)
   const updateUserBio = async (userId: string, bio: string) => {
     return await supabase.from('profiles').update({ bio }).eq('id', userId);
   };

   const getUserProfile = async (userId: string) => {
     return await supabase.from('profiles').select('*').eq('id', userId).single();
   };
   ```

3. **Create useProfile hook**

   ```typescript
   // hooks/useProfile.ts
   - Profile data management with caching
   - Bio editing functionality
   - Integration with existing auth context
   ```

4. **Update Navigation**
   - Add Profile tab to main navigation
   - Update from (Friends, Camera, Inbox, Send) to (Friends, Camera, Inbox, Send, Profile) temporarily
   - Profile tab shows current user's profile

5. **Integrate with Friends**
   - Add "View Profile" option in friends list
   - Navigate to friend's profile showing their bio

### Scope Limitations

- No art grid yet (will be empty/placeholder)
- Basic text-only bio editing
- No profile photos/avatars

### Verification

- [x] Can navigate to Profile tab
- [x] Profile shows current user's username and bio
- [x] Can edit bio text and save successfully
- [x] Can view friends' profiles from friends list
- [x] Bio changes persist after app restart
- [x] Empty art grid section shows placeholder text

### ✅ FEATURE COMPLETE

**Implementation Date**: Completed in Epic 1 Phase 1  
**Status**: All verification criteria met and tested
**Notes**: Successfully implemented with enhanced features including:

- Bio editing with loading states and input validation
- Profile navigation and context management
- Realtime profile synchronization across app instances
- Standardized button styling using ActionButton component
- Comprehensive error handling with ErrorHandler utility

## Feature 2: Conversations Tab & Text Messaging

### Overview

Replace Send/Inbox tabs with unified Conversations tab that supports persistent text messaging between friends.

### User Experience

Users see all their conversations in one place, can send persistent text messages, and have conversation history that doesn't disappear.

### Technical Implementation

#### Database Changes

```sql
-- Migration: 009_add_conversations.sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[2] NOT NULL, -- exactly 2 participants for MVP
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add indexes and RLS policies

-- Migration: 010_add_messages.sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'vibe_check')),
  content TEXT, -- text content for now
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add indexes and RLS policies

-- Migration: 011_add_rpc_functions.sql
CREATE OR REPLACE FUNCTION create_or_get_conversation(
  user1_id uuid,
  user2_id uuid
) RETURNS TABLE (...);

CREATE OR REPLACE FUNCTION update_conversation_activity(
  conversation_id uuid
) RETURNS void;
```

#### Frontend Development

1. **Create Conversations screens**

   ```typescript
   src/screens/Conversations/
   ├── ConversationsList.tsx  # List of active conversations
   └── ChatScreen.tsx         # Individual conversation with text messaging
   ```

2. **Create conversations service**

   ```typescript
   // services/conversations.ts
   -createOrGetConversation() -
     getUserConversations() -
     sendTextMessage() -
     getConversationMessages();
   ```

3. **Create useConversations hook**

   ```typescript
   // hooks/useConversations.ts
   - Conversation list management with caching
   - Real-time message subscriptions
   - Message sending/receiving
   ```

4. **Update Navigation**
   - Replace Send/Inbox tabs with single Conversations tab
   - Final navigation: (Friends, Camera, Conversations, Profile)

5. **Message Components**

   ```typescript
   components/
   └── TextMessage.tsx        # Text message display
   ```

6. **Real-time Integration**
   - Message delivery subscriptions
   - Conversation activity updates
   - Integration with existing realtime patterns

### Scope Limitations

- Text messages only (no VibeChecks yet)
- Basic conversation UI
- No message search or advanced features

### Verification

- [ ] Navigation shows Conversations tab instead of Send/Inbox
- [ ] Can see list of conversations ordered by recent activity
- [ ] Can send text messages to friends
- [ ] Can start new conversations from friends list
- [ ] Messages persist and show conversation history
- [ ] Real-time message delivery works
- [ ] Conversation list updates when new messages arrive

## Feature 3: VibeCheck Integration in Conversations

### Overview

Integrate existing ephemeral photo sharing (snaps) into conversation threads as "VibeChecks" with comprehensive renaming of all database tables, codebase references, and UI terminology.

### User Experience

Users can send VibeChecks within conversation threads alongside text messages, view them for 30 seconds, and see view status indicators.

### Technical Implementation

#### Database Renaming & Updates

```sql
-- Migration: rename_snaps_to_vibe_checks.sql
ALTER TABLE snaps RENAME TO vibe_checks;

-- Rename indexes
ALTER INDEX idx_snaps_recipient RENAME TO idx_vibe_checks_recipient;
ALTER INDEX idx_snaps_sender RENAME TO idx_vibe_checks_sender;
ALTER INDEX idx_snaps_inbox RENAME TO idx_vibe_checks_inbox;
ALTER INDEX idx_snaps_sent RENAME TO idx_vibe_checks_sent;

-- Update RLS policies
DROP POLICY "Users can view their own snaps" ON vibe_checks;
CREATE POLICY "Users can view their own vibe checks" ON vibe_checks
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

DROP POLICY "Users can insert snaps they send" ON vibe_checks;
CREATE POLICY "Users can insert vibe checks they send" ON vibe_checks
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

DROP POLICY "Recipients can update snap status" ON vibe_checks;
CREATE POLICY "Recipients can update vibe check status" ON vibe_checks
  FOR UPDATE USING (
    auth.uid() = recipient_id
  ) WITH CHECK (
    auth.uid() = recipient_id
  );

-- Update realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE snaps;
ALTER PUBLICATION supabase_realtime ADD TABLE vibe_checks;
```

#### Storage Bucket Renaming

- Rename `snaps` bucket to `vibe-checks` or update all references
- Update bucket policies with new naming

#### Comprehensive Codebase Renaming

1. **File & Directory Renaming**

   ```typescript
   // Rename files
   services/snaps.ts → services/vibeChecks.ts
   hooks/useSnaps.ts → hooks/useVibeChecks.ts
   screens/Snaps/ → screens/VibeChecks/

   // Update all imports throughout codebase
   import { useSnaps } from './hooks/useSnaps'
   → import { useVibeChecks } from './hooks/useVibeChecks'
   ```

2. **Type Definitions Update**

   ```typescript
   // types/index.ts
   interface Snap → interface VibeCheck
   type Message → type Message (keep, but update snap references)

   // Update all type references throughout codebase
   ```

3. **Service Layer Renaming**

   ```typescript
   // services/vibeChecks.ts (renamed from snaps.ts)
   sendSnap() → sendVibeCheck()
   getInboxSnaps() → getInboxVibeChecks()
   getSentSnaps() → getSentVibeChecks()
   markSnapAsViewed() → markVibeCheckAsViewed()
   subscribeToInboxChanges() → subscribeToInboxVibeCheckChanges()

   // Update all function calls throughout codebase
   ```

4. **Component Renaming**

   ```typescript
   // Rename component files and exports
   SnapViewer.tsx → VibeCheckViewer.tsx
   SnapPreview.tsx → VibeCheckPreview.tsx

   // Update component names and props
   <SnapViewer snap={snap} /> → <VibeCheckViewer vibeCheck={vibeCheck} />
   ```

5. **Hook Renaming**

   ```typescript
   // hooks/useVibeChecks.ts (renamed from useSnaps.ts)
   useSnaps() → useVibeChecks()
   useSnapSubscription() → useVibeCheckSubscription()

   // Update all hook usage throughout codebase
   const [snaps, loadSnaps] = useSnaps()
   → const [vibeChecks, loadVibeChecks] = useVibeChecks()
   ```

6. **Variable & Parameter Renaming**
   ```typescript
   // Throughout all files, rename:
   snap → vibeCheck
   snaps → vibeChecks
   snapId → vibeCheckId
   sendSnap → sendVibeCheck
   snapData → vibeCheckData
   ```

#### Frontend Development

7. **Update ChatScreen**
   - Add VibeCheck sending capability
   - Integrate VibeCheck display in conversation thread
   - Update to use renamed vibeChecks service

8. **Create VibeCheck components**

   ```typescript
   components/
   ├── VibeCheckMessage.tsx   # VibeCheck display in conversations
   └── VibeCheckViewer.tsx    # 30-second ephemeral viewer (renamed)
   ```

9. **Update conversations service**

   ```typescript
   // Add to services/conversations.ts
   const sendVibeCheck = async (conversationId: string, vibeCheckId: string) => {
     // Create message with type 'vibe_check' and reference to vibe_check
     // Update conversation activity
   };
   ```

10. **Integrate with existing camera**
    - Add "Send as VibeCheck" option after photo capture
    - Route to conversation selection or specific friend
    - Update camera service to use vibeChecks terminology

11. **Enhanced messaging UI**
    - Show VibeChecks as special message types in threads
    - Display view status (sent, delivered, viewed)
    - Integrate with existing 30-second viewing timer

### Scope Limitations

- Functionality remains the same (ephemeral photo sharing)
- No advanced VibeCheck features beyond existing capabilities
- Basic integration with conversations

### Verification

- [ ] Database migration completes successfully (snaps → vibe_checks)
- [ ] All indexes and RLS policies renamed and working
- [ ] Storage bucket renamed or references updated
- [ ] All files renamed (services, hooks, components, screens)
- [ ] All imports updated throughout codebase
- [ ] All type definitions use VibeCheck terminology
- [ ] All function names use VibeCheck terminology
- [ ] All variable names use vibeCheck terminology
- [ ] Can send VibeChecks from within conversations
- [ ] VibeChecks appear in conversation threads as special messages
- [ ] 30-second viewing functionality works with renamed components
- [ ] View status indicators work (sent, viewed, etc.)
- [ ] Can send VibeChecks from camera to specific conversations
- [ ] All UI text says "VibeCheck" instead of "snap"
- [ ] Real-time VibeCheck delivery works with renamed table
- [ ] No "snap" references remain anywhere in codebase
- [ ] App functionality identical to before, just with new naming

## Feature 4: CLIP Embeddings & Similarity Infrastructure

### Overview

Set up the backend infrastructure for art similarity using CLIP embeddings, including database schema, Edge Functions, and Replicate API integration.

### User Experience

No user-facing changes yet - this is pure backend infrastructure to enable VibeReel creation in the next feature.

### Technical Implementation

#### Database Changes

```sql
-- Migration: 012_add_art_pieces.sql
CREATE TABLE art_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  embedding VECTOR(512), -- CLIP embedding dimension
  vibe_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add vector indexes and RLS policies

-- Migration: 013_add_vibe_reels.sql
CREATE TABLE vibe_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  primary_art_id UUID REFERENCES art_pieces(id) ON DELETE CASCADE,
  selected_art_ids UUID[] NOT NULL, -- up to 7 pieces
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add indexes and RLS policies

-- Migration: 014_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
-- Add vector similarity indexes

-- Migration: 015_add_similarity_functions.sql
CREATE OR REPLACE FUNCTION find_similar_art(
  query_embedding vector(512),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 50
) RETURNS TABLE (...);
```

#### Storage Setup

- Create `art-pieces` bucket with public read access
- Configure bucket policies for authenticated uploads

#### Edge Functions Development

1. **generate-art-embeddings**

   ```typescript
   // supabase/functions/generate-art-embeddings/index.ts
   export default async function handler(req: Request) {
     const { artImageUrl } = await req.json();

     // Call Replicate CLIP API
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
     return new Response(JSON.stringify({ embedding: result.output }));
   }
   ```

2. **Environment Setup**
   - Add `REPLICATE_API_TOKEN` to Supabase secrets
   - Test Edge Function deployment
   - Verify Replicate API connectivity

#### Backend Services Implementation

3. **Create complete art similarity service**

   ```typescript
   // services/artSimilarity.ts
   export const generateEmbedding = async (imageUrl: string) => {
     const { data, error } = await supabase.functions.invoke('generate-art-embeddings', {
       body: { artImageUrl: imageUrl },
     });

     if (error) throw error;
     return data.embedding;
   };

   export const findSimilarArt = async (
     embedding: number[],
     excludeUserId?: string,
     matchThreshold = 0.8,
     matchCount = 50
   ) => {
     const { data, error } = await supabase.rpc('find_similar_art', {
       query_embedding: embedding,
       match_threshold: matchThreshold,
       match_count: matchCount,
     });

     if (error) throw error;
     return data;
   };
   ```

### Scope Limitations

- No user interface yet
- Backend infrastructure only
- Testing via direct API calls

### Verification

- [ ] All database migrations run successfully
- [ ] art_pieces and vibe_reels tables created with proper constraints
- [ ] pgvector extension enabled and working
- [ ] Edge Functions deploy without errors
- [ ] Can call Replicate API and receive embeddings
- [ ] RLS policies prevent unauthorized access
- [ ] Storage bucket accepts test uploads
- [ ] Vector similarity RPC functions execute correctly
- [ ] artSimilarity service functions work end-to-end
- [ ] Can generate embeddings for test images
- [ ] Can find similar art using test embeddings
- [ ] Service error handling works properly

## Feature 5: VibeReel Creation & Playback

### Overview

Implement the core VibeReel functionality: capturing art photos, browsing similar art via CLIP embeddings, selecting up to 7 pieces, creating collaborative stories, and viewing playback with username attribution.

### User Experience

Users can take photos of their art, see similar art from the global pool, select pieces to create a VibeReel story, view rapid-fire playback with usernames, and see their art appear in their profile. Their art automatically enters the global pool for others to discover.

### Technical Implementation

#### Database Migration for Vibe Counting

```sql
-- Migration: 016_add_vibe_count_function.sql
CREATE OR REPLACE FUNCTION increment_vibe_count(
  art_piece_id uuid
) RETURNS TABLE (
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

#### Frontend Development

1. **Create VibeReel screens**

   ```typescript
   src/screens/VibeReel/
   ├── CreateVibeReel.tsx    # Art capture + similarity browser
   └── VibeReelPlayer.tsx    # Rapid-fire playback with attribution
   ```

2. **VibeReel service layer**

   ```typescript
   // services/vibeReels.ts
   import { generateEmbedding, findSimilarArt } from './artSimilarity';

   const createVibeReel = async (imageFile: File, selectedArtIds: string[]) => {
     // 1. Upload image to art-pieces storage
     const { data: uploadData, error: uploadError } = await supabase.storage
       .from('art-pieces')
       .upload(`${userId}/${Date.now()}.jpg`, imageFile);

     if (uploadError) throw uploadError;

     // 2. Generate CLIP embedding using existing service
     const embedding = await generateEmbedding(uploadData.path);

     // 3. Create art_piece record
     const { data: artPiece, error: artError } = await supabase
       .from('art_pieces')
       .insert({
         user_id: userId,
         image_url: uploadData.path,
         embedding: embedding,
       })
       .select()
       .single();

     if (artError) throw artError;

     // 4. Create vibe_reel record
     const { data: vibeReel, error: vibeReelError } = await supabase
       .from('vibe_reels')
       .insert({
         creator_id: userId,
         primary_art_id: artPiece.id,
         selected_art_ids: selectedArtIds,
       })
       .select()
       .single();

     if (vibeReelError) throw vibeReelError;

     // 5. Increment vibe counts for selected art
     for (const artId of selectedArtIds) {
       await supabase.rpc('increment_vibe_count', { art_piece_id: artId });
     }

     return vibeReel;
   };

   const getUserVibeReels = async (userId: string) => {
     return await supabase
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
   };

   const getUserArtPieces = async (userId: string) => {
     return await supabase
       .from('art_pieces')
       .select('*')
       .eq('user_id', userId)
       .order('created_at', { ascending: false });
   };
   ```

3. **Use existing art similarity service**
   - Import and use the `artSimilarity.ts` service created in Feature 4
   - No need to re-implement similarity functions
   - Focus on VibeReel-specific logic

4. **VibeReel components**

   ```typescript
   components/
   ├── SimilarArtBrowser.tsx # Grid of similar art for selection
   ├── ArtPiece.tsx         # Individual art piece display
   └── VibeReelPlayer.tsx   # Animated playback component
   ```

5. **Camera integration**
   - Add "Create VibeReel" option to camera screen
   - Route to similarity browsing after art capture
   - Integrate with existing camera functionality

6. **Similarity browsing UI**
   - Display similar art in grid format
   - Allow selection of up to 7 pieces
   - Show similarity scores and usernames
   - Multi-select interface

7. **VibeReel playback**
   - Rapid-fire image transitions (React Native Reanimated)
   - Show selected art pieces followed by user's piece
   - Display username attribution for each piece
   - Smooth transitions between images

8. **Profile integration**
   - Update ProfileScreen to show art grid
   - Display user's created art pieces
   - Show basic info (no Vibes counter yet)

#### Data Flow

1. User captures art photo → Upload to storage
2. Generate CLIP embedding → Store in art_pieces table
3. Find similar art → Display for selection
4. User selects up to 7 pieces → Create VibeReel
5. VibeReel playback → Show with usernames
6. Art appears in user's profile grid

### Scope Limitations

- No Vibes counter display yet
- Basic playback animation
- No sharing or advanced features

### Verification

- [ ] Can capture art photos through camera
- [ ] Art photos generate CLIP embeddings successfully
- [ ] Similar art displays based on vector similarity
- [ ] Can select up to 7 similar art pieces
- [ ] VibeReel creation completes successfully
- [ ] VibeReel playback shows smooth transitions with usernames
- [ ] Created art pieces appear in user's profile art grid
- [ ] Art pieces enter global pool and appear for other users
- [ ] Similar art recommendations are relevant and accurate
- [ ] Complete flow from capture to playback works end-to-end

## Feature 6: Vibes Counter & Viral Mechanics

### Overview

Implement the popularity tracking system where art pieces gain "Vibes" when used in other users' VibeReels, completing the viral sharing mechanics.

### User Experience

Users can see how many times their art has been "Vibed" (used in other VibeReels) through counters displayed on their profile art grid, creating a popularity and engagement system.

### Technical Implementation

#### Database Integration

- Leverage existing vibe_count field in art_pieces table
- Use existing increment_vibe_count RPC function

#### Frontend Development

1. **Vibes counter display**

   ```typescript
   components/
   └── VibesCounter.tsx      # "Vibes: 43" display on art pieces
   ```

2. **Update profile components**
   - Show Vibes counter on each art piece in profile grid
   - Update ArtPiece component to display counter
   - Style counters to be visible but not overwhelming

3. **Real-time updates**

   ```typescript
   // Add to useProfile hook
   const subscribeToVibeUpdates = userId => {
     return supabase
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
   };
   ```

4. **Update VibeReel creation**
   - Ensure vibe counts increment when art is selected
   - Provide user feedback when their art gets "Vibed"

5. **Enhanced art browsing**
   - Show Vibes counters in similarity browser
   - Allow sorting by popularity in addition to similarity

#### Viral Mechanics Completion

- Art creation → Global pool entry
- Selection in VibeReels → Vibe count increment
- Profile display → Popularity visibility
- Real-time updates → Immediate feedback

### Scope Limitations

- Basic counter display only
- No advanced analytics or trends
- No notification system for Vibes

### Verification

- [ ] Vibes counters display on profile art grid
- [ ] Counters increment when art is used in VibeReels
- [ ] Real-time updates work when art gets "Vibed"
- [ ] Counters show in similarity browser
- [ ] Multiple users can "Vibe" the same art piece
- [ ] Counter accuracy verified through database
- [ ] Visual design integrates well with art grid
- [ ] Complete viral loop mechanics function end-to-end

## Success Criteria

### Epic Completion Requirements

- [ ] All 6 features implemented and verified
- [ ] Navigation updated to (Friends, Camera, Conversations, Profile)
- [ ] Enhanced messaging with text + VibeChecks functional
- [ ] VibeReel creation with CLIP similarity working
- [ ] Artist profiles with bio and art grids functional
- [ ] Vibes counter popularity system operational
- [ ] Global art pool with viral mechanics complete
- [ ] All terminology updated from "snaps" to "VibeChecks"
- [ ] System architecture documentation updated

### Technical Debt & Future Considerations

- Automated testing framework (future epic)
- Advanced similarity algorithms (future enhancement)
- Performance optimizations for scale (future epic)
- Desktop/web version support (nice to have)
- Advanced privacy controls (future feature)
