# SnapConnect System Architecture

## Architecture Overview

SnapConnect follows a client-server architecture with a React Native mobile client connecting to Supabase backend services. The system emphasizes real-time communication, ephemeral content, and secure media sharing.

### High-Level Components

1. **Mobile Client** - React Native/Expo app with 4-tab navigation
2. **Authentication Service** - Supabase Auth for user management
3. **Database** - PostgreSQL with Row Level Security
4. **Storage Service** - Supabase Storage for media files
5. **Realtime Service** - WebSocket connections for live updates
6. **Messaging Service** - Real-time text messaging with conversations
7. **CDN** - Content delivery for media files

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
  - Story posting/viewing (context provider with caching)
  - Profile management (bio editing, user profiles)
  - Filter application
  - Realtime subscription management (centralized)
  - Error handling (standardized utility)

### Authentication Service

- **Responsibilities**: User registration, login, session management, password reset
- **Technology**: Supabase Auth
- **Integration**: JWT tokens for API access

### Database Service

- **Responsibilities**: Data persistence, business logic (via RLS), data integrity
- **Technology**: PostgreSQL 15
- **Key Tables**:
  - `profiles` - User information (including bio text)
  - `friendships` - Friend connections
  - `conversations` - Direct message conversations between users
  - `messages` - Multi-type messages (text and VibeCheck) with read receipts
  - `vibe_checks` - Ephemeral media messages (formerly snaps)
  - `stories` - 24-hour posts
  - `story_views` - View tracking

### Storage Service

- **Responsibilities**: Media file storage, URL generation, access control
- **Technology**: Supabase Storage (S3-compatible)
- **Buckets**:
  - `media` - Private media files for VibeChecks and stories
  - `profiles` - User profile images

### Realtime Service

- **Responsibilities**: WebSocket management, change notifications, presence
- **Technology**: Supabase Realtime
- **Channels**:
  - Friendship changes
  - Conversation updates
  - Real-time messaging (per conversation)
  - VibeCheck updates
  - Story updates
  - Status updates

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

### Story Posting Flow

1. User captures photo
2. Photo uploaded to Stories bucket
3. Story record created (replaces existing)
4. Realtime broadcast to all friends
5. Story appears in friends' story rows
6. Auto-expires after 24 hours via database

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
│   ├── StoriesContext.tsx (Stories + caching)
│   └── RealtimeContext.tsx (Centralized subscriptions)
├── Navigation/
│   ├── MainTabs (Friends, Camera, Conversations, Profile)
│   └── Stack Navigators per tab
├── Screens/
│   ├── Auth/ (Login, Signup)
│   ├── Camera/ (Capture, MediaPreview, Filters)
│   ├── Main/ (Friends: List, Requests, Search)
│   ├── Conversations/ (ConversationsList, ConversationDetail)
│   ├── VibeChecks/ (FriendSelector, Inbox, Sent, Viewer)
│   └── Profile/ (ProfileScreen, EditProfile)
├── Components/
│   ├── UI/ (ActionButton, FormInput, LoadingSpinner, RefreshableList)
│   ├── Common/ (ErrorBoundary, AuthErrorBoundary)
│   ├── Features/ (StoriesRow, StoryCircle, FilteredImage)
│   └── Messages/ (VibeCheckMessage)
├── Services/
│   ├── supabase.ts (Client setup)
│   ├── friends.ts (Friend operations)
│   ├── conversations.ts (Multi-type messaging & conversations)
│   ├── vibeChecks.ts (VibeCheck operations)
│   ├── stories.ts (Story operations)
│   ├── profiles.ts (Profile management)
│   └── media.ts (File upload/processing)
├── Hooks/
│   ├── useAuth.ts (Authentication state)
│   ├── useFriends.ts (Friend data + context)
│   ├── useStories.ts (Story data + context)
│   ├── useVibeChecks.ts (VibeCheck data management)
│   ├── useProfile.ts (Profile management + sync)
│   ├── useProfileUsername.ts (Lightweight profile data)
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
stories (id, user_id, media_url, snap_type, filter_type, expires_at)
story_views (story_id, viewer_id, viewed_at)

-- Recent migrations
-- Migration 008: ALTER TABLE profiles ADD COLUMN bio TEXT;
-- Migration 009: Real-time messaging system (conversations & messages)
-- Migration 010: Enable real-time publication for messaging tables
-- Migration 011: Rename snaps to vibe_checks
-- Migration 012: Update vibe_checks indexes and policies
-- Migration 013: Add message_type and vibe_check_id to messages table
-- Migration 014: Rename snap_type to vibe_check_type
-- Migration 015: Enable real-time publication for vibe_checks

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
idx_stories_expires_at
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
- Centralized realtime subscription management
- Multi-type messaging with optimistic updates
- Component memoization for conversation rendering
- Multi-level client-side caching with user isolation
- Cache-first data loading for instant UI responses
- Standardized error handling with user notifications
- Context-based state management with background refresh
- Mount state tracking to prevent memory leaks
- CDN for media delivery
- One-time viewing enforcement at database level

### Future Scalability

- Database read replicas
- Redis caching layer for messaging
- Message queuing for high-volume messaging
- Media processing pipeline
- Horizontal scaling of services
- Geographic distribution
- Message archive/pagination for large conversation histories

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
