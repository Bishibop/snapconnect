# SnapConnect Tech Stack - Final Architecture

## Core Features

### Phase 1: Core
1. **Ephemeral Messaging**
   - Real-time photo/video sharing
   - Disappearing messages with timers
   - Basic screenshot detection

2. **Camera & Filters**
   - Simple AR filters (client-side)
   - Basic camera effects
   - Photo/video capture

3. **Authentication & Social**
   - User registration/login
   - Friend management (add, remove, search)
   - User profiles

4. **Stories**
   - 24-hour expiring posts
   - View friends' stories
   - Story replies

5. **Group Messaging**
   - Create group chats
   - Share media in groups
   - Real-time messaging

### Phase 2: RAG Enhancement
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
  - `expo-notifications` - Push notifications
  - `expo-media-library` - Media access
  - `expo-secure-store` - Secure token storage

### Backend (Supabase)
- **PostgreSQL Database**
  - Users, messages, friendships, stories tables
  - Row Level Security (RLS) for authorization
  - Triggers for automated tasks

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
  - Presence tracking (online status)
  - Broadcast for typing indicators

- **Edge Functions**
  - Push notifications via Expo Push API
  - Scheduled cleanup of expired content
  - Media processing tasks
  - RAG API integration (Phase 2)

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

### Push Notifications
- **Expo Push Service**
  - Free push notification delivery
  - Works with Supabase Edge Functions
  - No additional setup required

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

**Sending a Snap:**
```
1. User captures photo/video (expo-camera)
2. Compress media client-side
3. Upload to Supabase Storage
4. Insert message record in PostgreSQL
5. Realtime notifies recipient (if online)
6. Edge Function sends push (if offline)
7. Auto-delete after viewing
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

### Database Schema (Key Tables)
```sql
-- Users
profiles (id, username, avatar_url, push_token)

-- Messages
messages (id, sender_id, recipient_id, media_url,
          expires_at, viewed_at, message_type)

-- Stories
stories (id, user_id, media_url, created_at, expires_at)

-- Friendships
friendships (user_id, friend_id, created_at)

-- Groups
groups (id, name, created_by)
group_members (group_id, user_id)
```

### Security Considerations
- Row Level Security on all tables
- Client-side screenshot detection
- Ephemeral design (auto-deletion)
- Rate limiting on Edge Functions

### Scaling Considerations
- Monitor storage usage closely
- Implement CDN when needed (Cloudinary)
- Database indexes on frequently queried fields
- Connection pooling for Edge Functions
