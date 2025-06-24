# SnapConnect Tech Stack - Phase 1 Architecture

## Core Features

### Phase 1: MVP Features
1. **Visual Snap Messaging**
   - Photo/video capture and sharing
   - Visual-only communication (no text messages)
   - Real-time delivery via Supabase Realtime
   - Sent snaps tracking with status updates

2. **Disappearing Messages**
   - 5-second timer for photos
   - Full duration playback for videos
   - One-time viewing only
   - Complete removal after viewing

3. **Friend Management**
   - User search by username
   - Friend requests (send/receive/accept/decline)
   - Friends list management
   - Real-time request updates

4. **Stories**
   - 24-hour visual posts
   - One story per user at a time
   - Mixed with snaps in unified inbox feed
   - Same disappearing behavior as snaps

5. **Multi-Friend Snap Sending**
   - Select multiple recipients when sending
   - Individual snap copies (not group chats)
   - Same disappearing rules apply

6. **Simple Color Filters**
   - Post-capture filters only
   - 6 basic color effects
   - Applied before sending snaps

## Navigation Structure

### 4-Tab Navigation System
1. **Friends Tab** - Friend list, requests, add friends
2. **Camera Tab** (Default) - Capture photos/videos
3. **Inbox Tab** - Received snaps and stories feed
4. **Sent Tab** - Sent snaps with delivery/opened status

### Key Navigation Principles
- Camera-first experience (default tab)
- No deep navigation hierarchies
- Full-screen modal viewers
- Auto-return after timed events

---

## Future Phase 2: RAG Enhancement
1. **Personalized Content Generation**
   - AI-powered caption suggestions
   - Context-aware story ideas
   - Personalized filter recommendations

2. **Intelligent Recommendations**
   - RAG-based friend suggestions
   - Content discovery
   - Trending topics

3. **AI-Enhanced Creation**
   - Auto-generated templates
   - Smart editing suggestions
   - Context-aware stickers

## Final Tech Stack

### Frontend
- **React Native + Expo**
  - Cross-platform mobile development
  - Managed workflow for faster development
  - Built-in camera, notifications, and media handling

- **TypeScript**
  - Type safety across the application
  - Better developer experience

- **Zustand**
  - Lightweight state management
  - Simple API for global state

- **React Navigation**
  - Screen navigation and routing
  - Stack, tab, and drawer navigators

- **Core Expo Packages**
  - `expo-camera` - Photo/video capture
  - `expo-av` - Video playback in preview
  - `expo-media-library` - Media access
  - `expo-secure-store` - Secure token storage
  - `react-native-image-filter-kit` - Color filters

### Backend (Supabase)
- **PostgreSQL Database**
  - profiles, snaps, friendships, stories tables
  - Row Level Security (RLS) for authorization
  - Triggers for automated tasks (story expiration)

- **Supabase Auth**
  - User authentication
  - Social login support
  - JWT token management

- **Supabase Storage**
  - Media file storage (1GB free tier)
  - Direct client uploads
  - Storage policies for security

- **Supabase Realtime**
  - WebSocket connections for live updates
  - Database change notifications
  - Real-time snap delivery
  - Live status updates (delivered/opened)

- **Edge Functions**
  - Scheduled cleanup of expired content
  - Story expiration management
  - Future: Push notifications (Phase 2)
  - Future: RAG API integration (Phase 2)

### Development & Tooling
- **Git + GitHub**
  - Version control
  - Collaboration

- **ESLint + Prettier**
  - Code quality and formatting
  - Consistent code style

- **React Native Debugger**
  - Development debugging
  - Network inspection

### Styling
- **React Native StyleSheet**
  - Built-in styling solution
  - Performance optimized
  - Theme constants file for consistency

### Phase 1 Limitations
- **No Push Notifications**
  - Real-time updates only when app is open
  - Users must manually check for new snaps
  - Simplified implementation

### Media Handling
- **Client-side compression**
  - `react-native-image-resizer`
  - Reduce upload sizes

- **Aggressive deletion policy**
  - True ephemeral design
  - Manage storage limits

### Phase 2: RAG Infrastructure
- **OpenAI API**
  - GPT-4 for content generation
  - Text embeddings
  - GPT-4 Vision for image analysis

- **pgvector (Supabase)**
  - Vector similarity search
  - Integrated with PostgreSQL
  - Store embeddings for content matching

## Architecture Decisions

### Why This Stack?
1. **Rapid Development**: Expo + Supabase provides most features out-of-box
2. **Cost Effective**: Generous free tiers for MVP
3. **Scalable**: Can grow with user base
4. **RAG Ready**: PostgreSQL + pgvector perfect for AI features

### Key Architectural Patterns
1. **Client-Heavy**: AR filters, media compression on device
2. **Realtime First**: WebSockets for instant updates
3. **Ephemeral by Design**: Aggressive deletion, minimal storage
4. **Edge Computing**: Supabase Edge Functions for server logic

### Data Flow Examples

**Sending a Snap (Phase 1):**
```
1. User captures photo/video (expo-camera)
2. Optional: Apply color filter
3. Select friend(s) from list
4. Compress media client-side
5. Upload to Supabase Storage
6. Insert snap record(s) in PostgreSQL
7. Realtime notifies recipient (if app open)
8. Auto-delete after viewing
```

**RAG-Enhanced Caption:**
```
1. User uploads photo
2. Edge Function analyzes image
3. Query vector DB for similar content
4. LLM generates contextual caption
5. Return suggestions to user
```

## Implementation Notes

### Database Schema (Phase 1)
```sql
-- Profiles (extends auth.users with app-specific data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snaps
CREATE TABLE snaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  media_url TEXT NOT NULL, -- just the storage path
  snap_type TEXT NOT NULL CHECK (snap_type IN ('photo', 'video')),
  filter_type TEXT,
  duration INTEGER, -- video duration in seconds
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ
);

-- Stories (with soft delete)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  media_url TEXT NOT NULL, -- just the storage path
  snap_type TEXT NOT NULL CHECK (snap_type IN ('photo', 'video')),
  filter_type TEXT,
  duration INTEGER,
  is_active BOOLEAN DEFAULT true, -- for soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- Friendships (bidirectional - 2 records per friendship)
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  friend_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  requested_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Performance Indexes
CREATE INDEX idx_snaps_recipient ON snaps(recipient_id, created_at DESC);
CREATE INDEX idx_snaps_sender ON snaps(sender_id, created_at DESC);
CREATE INDEX idx_snaps_inbox ON snaps(recipient_id, status, created_at DESC);
CREATE INDEX idx_snaps_sent ON snaps(sender_id, status, created_at DESC);
CREATE INDEX idx_stories_active ON stories(user_id, is_active, expires_at);
CREATE INDEX idx_friendships_users ON friendships(user_id, status);
CREATE INDEX idx_friendships_pending ON friendships(friend_id, status) WHERE status = 'pending';
```

### Security Considerations
- Row Level Security on all tables
- Ephemeral design (auto-deletion)
- Rate limiting on Edge Functions
- Media URLs with expiration

### Scaling Considerations
- Monitor storage usage closely
- Implement CDN when needed (Cloudinary)
- Database indexes on frequently queried fields
- Connection pooling for Edge Functions
