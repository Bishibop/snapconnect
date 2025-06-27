# SnapConnect System Architecture

## Architecture Overview

SnapConnect follows a client-server architecture with a React Native mobile client connecting to Supabase backend services. The system emphasizes real-time communication, ephemeral content, and secure media sharing.

### High-Level Components

1. **Mobile Client** - React Native/Expo app with 4-tab navigation
2. **Authentication Service** - Supabase Auth for user management
3. **Database** - PostgreSQL with Row Level Security
4. **Storage Service** - Supabase Storage for media files
5. **Realtime Service** - WebSocket connections for live updates
6. **CDN** - Content delivery for media files

## Service Boundaries

### Mobile Application

- **Responsibilities**: UI rendering, camera control, media capture, local state management, real-time subscriptions
- **Technologies**: React Native, Expo, TypeScript
- **Key Modules**:
  - Authentication (context provider)
  - Camera system (photo capture)
  - Friend management (context provider with realtime)
  - Snap sending/receiving
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
  - `snaps` - Ephemeral messages
  - `stories` - 24-hour posts
  - `story_views` - View tracking

### Storage Service

- **Responsibilities**: Media file storage, URL generation, access control
- **Technology**: Supabase Storage (S3-compatible)
- **Buckets**:
  - `snaps` - Private photos for direct messages
  - `stories` - Semi-public photos for stories

### Realtime Service

- **Responsibilities**: WebSocket management, change notifications, presence
- **Technology**: Supabase Realtime
- **Channels**:
  - Friendship changes
  - New snaps
  - Story updates
  - Status updates

## Core Data Flow

### User Registration/Login Flow

1. User enters credentials in mobile app
2. App calls Supabase Auth API
3. Auth service validates and returns JWT
4. App stores token securely
5. Profile created in database via trigger

### Snap Sharing Flow

1. User captures photo via camera
2. Photo uploaded to Supabase Storage
3. Snap record created in database
4. Realtime notification sent to recipient
5. Recipient receives notification and fetches snap
6. 5-second timer starts on view
7. Snap marked as viewed in database

### Story Posting Flow

1. User captures photo
2. Photo uploaded to Stories bucket
3. Story record created (replaces existing)
4. Realtime broadcast to all friends
5. Story appears in friends' story rows
6. Auto-expires after 24 hours via database

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

- **Friends Only**: Snaps visible only to sender/recipient
- **Public Profiles**: Usernames searchable by all
- **Friend Stories**: Stories visible to friends only
- **Owner Only**: Profile edits, snap deletion

### Security Policies

```sql
-- Example RLS policy for snaps
CREATE POLICY "Users can view snaps sent to them"
ON snaps FOR SELECT
USING (auth.uid() = recipient_id);

-- Example storage policy
Bucket 'snaps' - Authenticated users only
Bucket 'stories' - Public read with signed URLs
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
│   ├── MainTabs (Friends, Camera, Inbox, Sent, Profile)
│   └── Stack Navigators per tab
├── Screens/
│   ├── Auth/ (Login, Signup)
│   ├── Camera/ (Capture, Preview, Filters)
│   ├── Main/ (Friends: List, Requests, Search)
│   ├── Snaps/ (Inbox, Sent, Viewer)
│   └── Profile/ (ProfileScreen, EditProfile)
├── Components/
│   ├── UI/ (ActionButton, FormInput, LoadingSpinner)
│   ├── Common/ (ErrorBoundary, AuthErrorBoundary)
│   └── Features/ (StoriesRow, StoryCircle, FilteredImage)
├── Services/
│   ├── supabase.ts (Client setup)
│   ├── friends.ts (Friend operations)
│   ├── snaps.ts (Snap operations)
│   ├── stories.ts (Story operations)
│   ├── profiles.ts (Profile management)
│   └── media.ts (File upload/processing)
├── Hooks/
│   ├── useAuth.ts (Authentication state)
│   ├── useFriends.ts (Friend data + context)
│   ├── useStories.ts (Story data + context)
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
snaps (id, sender_id, recipient_id, media_url, status, expires_at)
stories (id, user_id, media_url, expires_at)
story_views (story_id, viewer_id, viewed_at)

-- Recent additions (Epic 1 Phase 1)
-- Migration 008: ALTER TABLE profiles ADD COLUMN bio TEXT;

-- Indexes for performance
idx_friendships_user_id
idx_friendships_friend_id
idx_snaps_recipient_status
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
- **Performance Optimizations**:
  - Background refresh maintains cache while showing stale data
  - Lazy loading for initial render
  - Selective invalidation on specific data changes
  - Automatic memory cleanup on app state changes

## Scalability Considerations

### Current Optimizations

- Efficient database indexes
- Lazy loading of images
- Centralized realtime subscription management
- Multi-level client-side caching with user isolation
- Standardized error handling with user notifications
- Context-based state management with background refresh
- Mount state tracking to prevent memory leaks
- CDN for media delivery

### Future Scalability

- Database read replicas
- Redis caching layer
- Media processing pipeline
- Horizontal scaling of services
- Geographic distribution

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
