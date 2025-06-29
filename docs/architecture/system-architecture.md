# SnapConnect System Architecture

## Architecture Overview

SnapConnect follows a client-server architecture with a React Native mobile client connecting to Supabase backend services. The system emphasizes real-time communication, ephemeral content, and secure media sharing.

### High-Level Components

1. **Mobile Client** - React Native/Expo app with 4-tab navigation
2. **Authentication Service** - Supabase Auth for user management
3. **Database** - PostgreSQL with Row Level Security
4. **Storage Service** - Supabase Storage for media files
5. **Realtime Service** - WebSocket connections for live updates (limited use)
6. **Messaging Service** - Real-time text messaging with conversations
7. **CDN** - Content delivery for media files
8. **Edge Functions** - Serverless functions for AI/ML integrations
9. **Vector Database** - pgvector for similarity search
10. **Polling Service** - Client-side polling for VibeReels updates

## Service Boundaries

### Mobile Application

- **Responsibilities**: UI rendering, camera control, media capture, local state management, real-time subscriptions
- **Technologies**: React Native, Expo, TypeScript
- **Key Modules**:
  - Authentication (context provider)
  - Camera system (photo/video capture)
  - Friend management (context provider with realtime)
  - Messaging system (conversations with text and VibeCheck messages)
  - VibeCheck sending/receiving (ephemeral media messages)
  - VibeReel creation/viewing (replaced Stories)
  - Profile management (bio editing, user profiles, art grid)
  - Filter application
  - Realtime subscription management (centralized, reduced usage)
  - Error handling (standardized utility)
  - Art similarity browsing (CLIP embeddings)

### Authentication Service

- **Responsibilities**: User registration, login, session management, password reset
- **Technology**: Supabase Auth
- **Integration**: JWT tokens for API access

### Database Service

- **Responsibilities**: Data persistence, business logic (via RLS), data integrity, vector similarity search
- **Technology**: PostgreSQL 15 with pgvector extension
- **Key Tables**:
  - `profiles` - User information (including bio text)
  - `friendships` - Friend connections
  - `conversations` - Direct message conversations between users
  - `messages` - Multi-type messages (text and VibeCheck) with read receipts
  - `vibe_checks` - Ephemeral media messages (formerly snaps)
  - `art_pieces` - User-created art with CLIP embeddings (768-dim) for similarity search
  - `vibe_reels` - Collaborative art stories combining multiple art pieces
  - `vibe_reel_views` - View tracking for VibeReels

### Storage Service

- **Responsibilities**: Media file storage, URL generation, access control
- **Technology**: Supabase Storage (S3-compatible)
- **Buckets**:
  - `media` - Private media files for VibeChecks and stories
  - `profiles` - User profile images
  - `art-pieces` - Public art images for VibeReels (public read access)

### Realtime Service

- **Responsibilities**: WebSocket management, change notifications, presence
- **Technology**: Supabase Realtime
- **Channels**:
  - Friendship changes
  - Conversation updates
  - Real-time messaging (per conversation)
  - VibeCheck updates
  - Status updates

**Note**: VibeReels and art pieces no longer use realtime subscriptions to prevent O(N²) database load issues. Instead, a 1-second client-side polling mechanism is used.

### Edge Functions Service

- **Responsibilities**: Serverless compute for AI/ML operations, third-party API integrations
- **Technology**: Deno runtime on Supabase Edge Functions
- **Functions**:
  - `generate-art-embeddings` - CLIP model integration via Replicate API
- **Integration**: Called from client via supabase.functions.invoke()

### Vector Search Service

- **Responsibilities**: Similarity search for art discovery, semantic matching
- **Technology**: PostgreSQL with pgvector extension
- **Features**:
  - 768-dimensional CLIP embeddings (ViT-L model)
  - Cosine similarity search
  - IVFFlat indexing for performance
  - Configurable similarity thresholds (default 0.3 for MVP)

## Core Data Flow

### User Registration/Login Flow

1. User enters credentials in mobile app
2. App calls Supabase Auth API
3. Auth service validates and returns JWT
4. App stores token securely
5. Profile created in database via trigger

### VibeCheck Sharing Flow

1. User captures photo/video via camera
2. User selects filter (optional)
3. User selects friends to send to
4. Media uploaded to Supabase Storage
5. VibeCheck record created in database
6. Message record created in conversation with recipient
7. Realtime notification sent via conversation channel
8. Recipient sees VibeCheck message in conversation
9. Recipient taps to view (one-time viewing)
10. 30-second timer starts for photos
11. VibeCheck marked as opened in database

### VibeReel Creation Flow

1. User captures art photo via camera
2. Photo uploaded to art-pieces bucket (public)
3. CLIP embedding generated via Edge Function (768-dim)
4. Art piece record created with embedding
5. Similar art found using vector similarity search
6. User selects up to 7 similar pieces
7. VibeReel record created with selections
8. Selected art pieces' vibe counts increment
9. VibeReel can be posted to share with friends
10. Friends discover via 1-second polling (not realtime)

### Real-time Messaging Flow

1. User opens conversation (or creates new one)
2. App subscribes to real-time message updates
3. User sends either:
   - **Text Message**: Types and sends text
   - **VibeCheck**: Captures media → selects friend → creates VibeCheck message
4. Message appears instantly via optimistic update
5. Message saved to database with appropriate type
6. Real-time notification sent to recipient
7. Recipient receives message in real-time
8. Read receipts updated when message viewed
9. Conversation list updates with latest message
10. For VibeChecks: One-time viewing enforced for recipients

### Friend Connection Flow

1. User searches by username
2. Friend request created in database
3. Realtime notification to recipient
4. Recipient accepts/declines
5. Friendship record created if accepted
6. Both users' friend lists update in real-time

### Art Similarity Flow

1. User captures art photo via camera
2. Photo uploaded to art-pieces storage bucket (public)
3. App calls Edge Function with image URL
4. Edge Function calls Replicate API for CLIP embedding
5. 768-dimensional embedding vector returned (ViT-L model)
6. Art piece record created with embedding
7. Vector similarity search finds related art (threshold 0.3)
8. User selects up to 7 similar pieces for VibeReel
9. VibeReel record created with selected art IDs
10. Selected art pieces' vibe counts increment
11. Art enters global pool for discovery by others
12. VibeReel playback shows selected art + user's art with animations

## Technology Integration Points

### Mobile App ↔ Supabase Auth

- **Protocol**: HTTPS REST API
- **Authentication**: Email/password
- **Token Management**: Secure storage, auto-refresh

### Mobile App ↔ Database

- **Protocol**: PostgREST API (auto-generated)
- **Authentication**: JWT bearer tokens
- **Operations**: CRUD with RLS enforcement

### Mobile App ↔ Storage

- **Protocol**: HTTPS REST API
- **Authentication**: JWT tokens
- **Operations**: Upload, download, signed URLs

### Mobile App ↔ Realtime

- **Protocol**: WebSocket
- **Authentication**: JWT tokens
- **Subscriptions**: Table changes, presence

### Database ↔ Storage

- **Integration**: Storage URLs saved in database
- **Access Control**: RLS policies reference storage

### Mobile App ↔ Edge Functions

- **Protocol**: HTTPS REST API
- **Authentication**: JWT tokens in Authorization header
- **Operations**: Invoke functions via supabase.functions.invoke()

### Edge Functions ↔ External APIs

- **Replicate API**: HTTPS with API token authentication
- **Pattern**: Async predictions with polling
- **Error Handling**: Graceful degradation on API failures

## Security Overview

### Authentication & Authorization

- **User Authentication**: Email/password via Supabase Auth
- **API Authorization**: JWT tokens required for all requests
- **Database Authorization**: Row Level Security policies
- **Storage Authorization**: Bucket policies + signed URLs

### Data Protection

- **In Transit**: HTTPS/WSS encryption
- **At Rest**: Encrypted database and storage
- **Token Security**: Secure storage on device
- **Session Management**: Auto-refresh, logout on app background

### Access Control Patterns

- **Friends Only**: VibeChecks visible only to sender/recipient
- **Conversation Access**: Users can only see conversations they participate in
- **Message Privacy**: All message types visible only to conversation participants
- **One-Time Viewing**: VibeChecks can only be viewed once by recipients
- **Public Profiles**: Usernames searchable by all
- **Friend Stories**: Stories visible to friends only
- **Owner Only**: Profile edits, VibeCheck deletion

### Security Policies

```sql
-- Example RLS policy for VibeChecks
CREATE POLICY "Users can view vibe_checks sent to them"
ON vibe_checks FOR SELECT
USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Messaging RLS policies with multi-type support
CREATE POLICY "Users can see their conversations"
ON conversations FOR SELECT
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can view conversation messages"
ON messages FOR SELECT
USING (
  auth.uid() IN (
    SELECT participant1_id FROM conversations WHERE id = conversation_id
    UNION
    SELECT participant2_id FROM conversations WHERE id = conversation_id
  )
);

-- VibeCheck one-time viewing enforcement
CREATE POLICY "Recipients can update vibe_check status"
ON vibe_checks FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (status IN ('opened', 'expired'));

-- Example storage policy
Bucket 'media' - Authenticated users only with signed URLs
Bucket 'profiles' - Public read for avatars
```

## Component Details

### Mobile Client Architecture

```
App.tsx
├── Contexts/ (Global state providers)
│   ├── AuthContext.tsx (User authentication)
│   ├── FriendsContext.tsx (Friend management + realtime)
│   ├── VibeReelsContext.tsx (VibeReels + 1-second polling)
│   └── RealtimeContext.tsx (Centralized subscriptions, reduced scope)
├── Navigation/
│   ├── MainTabs (Friends, Camera, Conversations, Profile)
│   └── Stack Navigators per tab
├── Screens/
│   ├── Auth/ (Login, Signup)
│   ├── Camera/ (Capture, MediaPreview, Filters)
│   ├── Main/ (Friends: List, Requests, Search)
│   ├── Conversations/ (ConversationsList, ConversationDetail)
│   ├── VibeChecks/ (FriendSelector, Inbox, Sent, Viewer)
│   ├── VibeReel/ (CreateVibeReel, VibeReelPlayer, VibeReelPreview)
│   └── Profile/ (ProfileScreen with art grid, EditProfile)
├── Components/
│   ├── UI/ (ActionButton, FormInput, LoadingSpinner, RefreshableList)
│   ├── Common/ (ErrorBoundary, AuthErrorBoundary)
│   ├── Features/ (VibeReelsRow, VibeReelCircle, YourVibeReelCircle, ArtPiece, FilteredImage)
│   └── Messages/ (VibeCheckMessage)
├── Services/
│   ├── supabase.ts (Client setup)
│   ├── friends.ts (Friend operations)
│   ├── conversations.ts (Multi-type messaging & conversations)
│   ├── vibeChecks.ts (VibeCheck operations)
│   ├── vibeReels.ts (VibeReel operations + posting)
│   ├── profiles.ts (Profile management)
│   ├── media.ts (File upload/processing)
│   └── artSimilarity.ts (CLIP embeddings & vector search)
├── Hooks/
│   ├── useAuth.ts (Authentication state)
│   ├── useFriends.ts (Friend data + context)
│   ├── useVibeReels.ts (VibeReel data + context)
│   ├── useVibeChecks.ts (VibeCheck data management)
│   ├── useProfile.ts (Profile management + sync)
│   ├── useProfileUsername.ts (Lightweight profile data)
│   ├── useFriendSync.ts (Sync friend IDs to VibeReels context)
│   └── useRealtimeSubscription.ts (Subscription lifecycle)
└── Utils/
    ├── cache.ts (Multi-level caching system)
    ├── errorHandler.ts (Standardized error handling)
    ├── navigation.ts (Type-safe navigation)
    └── dateTime.ts (Time utilities)
```

### Database Schema Design

```sql
-- Core tables with relationships
profiles (id, username, email, avatar_url, bio)
friendships (user_id, friend_id, status, created_at)
conversations (id, participant1_id, participant2_id, last_message_at)
messages (id, conversation_id, sender_id, message_type, content, vibe_check_id, read_at, created_at)
vibe_checks (id, sender_id, recipient_id, media_url, vibe_check_type, filter_type, status, opened_at)
art_pieces (id, user_id, image_url, embedding VECTOR(768), vibe_count, created_at)
vibe_reels (id, creator_id, primary_art_id, selected_art_ids UUID[], created_at, posted_at)
vibe_reel_views (vibe_reel_id, viewer_id, viewed_at)

-- Recent migrations
-- Migration 008: ALTER TABLE profiles ADD COLUMN bio TEXT;
-- Migration 009: Real-time messaging system (conversations & messages)
-- Migration 010: Enable real-time publication for messaging tables
-- Migration 011: Rename snaps to vibe_checks
-- Migration 012: Enable pgvector extension for vector similarity search
-- Migration 013: Create art_pieces table with CLIP embeddings
-- Migration 014: Create vibe_reels table for collaborative art stories
-- Migration 015: Add similarity search functions (find_similar_art)
-- Migration 016: Add vibe count increment function
-- Migration 017: Create art-pieces storage bucket
-- Migration 018: Update embeddings to 768 dimensions (ViT-L model)
-- Migration 020: Add vibe_reel posting and views tracking
-- Migration 021: Optimize RLS policies to prevent O(N²) load
-- Migration 022: Remove vibe_reels from realtime publication

-- Indexes for performance
idx_friendships_user_id
idx_friendships_friend_id
idx_conversations_participant1
idx_conversations_participant2
idx_conversations_last_message
idx_messages_conversation
idx_messages_created
idx_messages_message_type
idx_messages_vibe_check_id
idx_vibe_checks_recipient_id
idx_vibe_checks_status
idx_art_pieces_user
idx_art_pieces_popular
idx_art_pieces_embedding (IVFFlat vector index)
idx_vibe_reels_creator
idx_vibe_reels_art (GIN index)
idx_vibe_reels_primary_art
idx_vibe_reels_posted (for querying posted VibeReels)
idx_vibe_reels_active_posted (composite for friend queries)
idx_vibe_reel_views_viewer (for view history)

-- RPC Functions
find_similar_art(query_embedding VECTOR(768), match_threshold, match_count) - Vector similarity search
increment_vibe_count(art_piece_id) - Atomic vibe count increment
create_or_get_conversation(user1_id, user2_id) - Conversation management
update_conversation_activity(conversation_id) - Activity timestamp update
```

### Caching Strategy

- **Multi-Level Architecture**: Memory cache → Context state → Database
- **User-Specific Caching**: Separate cache instances per user to prevent data leakage
- **Time-Based Invalidation**: Configurable TTL (5 minutes default) with automatic cleanup
- **Mount State Tracking**: Prevents setState on unmounted components using isMountedRef pattern
- **Cache Operations**:
  - `get()` - Retrieve from cache with TTL validation
  - `set()` - Store with automatic expiration
  - `invalidate()` - Force refresh on realtime updates
  - `clear()` - User logout cleanup
- **Messaging-Specific Caching**:
  - **Conversations**: 2-minute TTL for conversation list updates
  - **Messages**: 30-second TTL for individual conversation messages
  - **VibeChecks**: Cached until status changes (opened/expired)
  - **Cache-First Loading**: Instant UI display from cache while refreshing in background
  - **Optimistic Updates**: Messages appear immediately, replaced with real data
  - **Pending VibeChecks**: Temporary optimistic state for media uploads
- **Performance Optimizations**:
  - Background refresh maintains cache while showing stale data
  - Lazy loading for initial render
  - Selective invalidation on specific data changes
  - Automatic memory cleanup on app state changes

## Scalability Considerations

### Current Optimizations

- Efficient database indexes for message types and VibeChecks
- Lazy loading of images
- Reduced realtime subscription scope (removed vibe_reels to prevent O(N²) load)
- 1-second client-side polling for VibeReels updates
- Multi-type messaging with optimistic updates
- Component memoization for conversation rendering
- Multi-level client-side caching with user isolation
- Cache-first data loading for instant UI responses
- Standardized error handling with user notifications
- Context-based state management with background refresh
- Mount state tracking to prevent memory leaks
- CDN for media delivery
- One-time viewing enforcement at database level
- Vector indexing (IVFFlat) for fast similarity search
- Public storage bucket for art to avoid signed URL overhead
- Edge Function for scalable ML inference
- Async embedding generation to prevent UI blocking
- Client-side friend filtering for VibeReels (moved from RLS)
- Simplified RLS policies for better performance

### Future Scalability

- Database read replicas
- Redis caching layer for messaging
- Message queuing for high-volume messaging
- Media processing pipeline
- Horizontal scaling of services
- Geographic distribution
- Message archive/pagination for large conversation histories

## Feature: AI-Powered Art Similarity

### Overview

The art similarity feature enables semantic discovery of artwork using CLIP (Contrastive Language-Image Pre-training) embeddings. This infrastructure supports the upcoming VibeReel feature for collaborative visual storytelling.

### Architecture Components

1. **Edge Functions**: Serverless Deno runtime for API integrations
2. **Replicate API**: External ML service providing CLIP model inference
3. **pgvector**: PostgreSQL extension for vector similarity operations
4. **Public Storage**: Art pieces bucket for globally accessible images

### Technical Implementation

1. **Embedding Generation**:
   - Client uploads art to public storage bucket
   - Calls Edge Function with image URL
   - Edge Function invokes Replicate CLIP model (ViT-L)
   - Returns 768-dimensional embedding vector

2. **Similarity Search**:
   - Uses pgvector's cosine similarity operator (<=>)
   - IVFFlat index for performant nearest neighbor search
   - Configurable similarity threshold (default 0.3 for MVP)
   - Returns up to 50 similar art pieces
   - Excludes user's own art from results

3. **Data Model**:

   ```sql
   art_pieces:
   - embedding: VECTOR(768) - CLIP feature vector (ViT-L)
   - vibe_count: INTEGER - Popularity metric
   - image_url: TEXT - Public storage reference

   vibe_reels:
   - primary_art_id: UUID - User's original art
   - selected_art_ids: UUID[] - Up to 7 similar pieces
   - posted_at: TIMESTAMPTZ - When shared with friends

   vibe_reel_views:
   - vibe_reel_id: UUID - VibeReel reference
   - viewer_id: UUID - Who viewed it
   - viewed_at: TIMESTAMPTZ - When viewed
   ```

4. **Performance Considerations**:
   - IVFFlat indexing with 100 lists for balance of speed/accuracy
   - Async Edge Function calls to avoid blocking UI
   - Cached embeddings to prevent recomputation
   - Public bucket eliminates signed URL overhead

### Security & Privacy

- Art pieces are public by design for viral sharing
- User association maintained for attribution
- RLS policies control modification rights
- Edge Function secrets stored encrypted

### Future Enhancements

- Multiple embedding models for different art styles
- Text-to-image search using CLIP's multimodal capabilities
- Batch embedding generation for efficiency
- Regional Edge Function deployment for lower latency
- Return to realtime subscriptions when database load issues are resolved

## Feature: VibeReel Playback

### Overview

VibeReel playback provides an immersive viewing experience with smooth animations and attribution for collaborative art stories.

### Key Features

- **Double-buffered Animation**: Seamless transitions between art pieces
- **Variable Timing**: 0.75s for selected art, 10s for creator's main piece
- **Username Attribution**: @username displayed for each art piece
- **Progress Tracking**: Visual progress bar during playback
- **Zoom Effects**: Ken Burns-style zoom during display
- **Replay Support**: Tap to replay after completion

### Technical Implementation

1. **Animation System**: React Native Animated API with double buffering
2. **Image Preloading**: Next image loaded while current displays
3. **State Management**: Refs for performance-critical playback state
4. **Transition Effects**: Cross-fade with configurable durations
5. **Memory Management**: Cleanup timers and animations on unmount

## Feature: VibeChecks Integration

### Overview

VibeChecks (formerly Snaps) are ephemeral media messages integrated directly into conversations. Unlike traditional ephemeral messaging apps where disappearing messages exist separately, VibeChecks appear inline with text messages in conversations.

### Key Features

- **Unified Conversations**: Text and media messages in single conversation flow
- **One-Time Viewing**: Recipients can view VibeChecks only once
- **Timed Viewing**: 30-second timer for photos
- **Filter Support**: Apply visual filters before sending
- **Multi-Friend Sending**: Send same VibeCheck to multiple conversations
- **Optimistic UI**: Immediate feedback while uploading

### Technical Implementation

1. **Message Types**: Extended messages table with `message_type` enum ('text' | 'vibe_check')
2. **Foreign Key Reference**: Messages link to vibe_checks table via `vibe_check_id`
3. **Status Tracking**: VibeCheck status transitions: sent → delivered → opened → expired
4. **Real-time Updates**: Leverages existing conversation subscriptions
5. **Preview States**:
   - Recipients see placeholder with tap-to-view
   - Senders see thumbnail preview
   - Opened VibeChecks show "Already viewed" state

### Security & Privacy

- Row Level Security ensures only participants can view
- One-time viewing enforced at database level
- Media files stored with signed URLs
- Automatic expiration after viewing

## Monitoring & Observability

### Current Monitoring

- Supabase dashboard metrics
- Client-side error boundaries (AuthErrorBoundary, ErrorBoundary)
- Network request logging
- Standardized error handling with ErrorHandler utility

## Error Handling Architecture

### ErrorHandler Utility

- **Centralized Error Processing**: Single point for all error handling logic
- **User Notification Management**: Configurable alerts with contextual messages
- **Error Categorization**: API errors, cache errors, subscription errors
- **Silent Mode Support**: Background operations can fail silently
- **Logging Integration**: Consistent error logging format across services

### Error Handling Patterns

```typescript
// API Error Handling
ErrorHandler.handleApiError(error, 'fetch friends', false);

// Cache Error Handling (silent)
ErrorHandler.handleCacheError(error, 'friends list cache');

// Subscription Error Handling (silent)
ErrorHandler.handleSubscriptionError(error, 'stories');

// Custom Error Handling
ErrorHandler.handle(error, {
  context: 'profile update',
  showAlert: true,
  alertMessage: 'Failed to save profile changes',
});
```

### Error Boundaries

- **AuthErrorBoundary**: Handles authentication-related failures
- **ErrorBoundary**: Catches unexpected React component errors
- **Service Layer**: Standardized error propagation from services to UI

### Future Monitoring

- APM integration (Sentry)
- Custom analytics events
- Performance metrics
- User behavior tracking
