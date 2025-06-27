# Epic Brief: Epic 1 - VibeReel

## Overview

VibeReel transforms SnapConnect into a social networking platform for artists, enabling them to create collaborative visual stories by combining their art with semantically similar works from a global community pool, while maintaining intimate conversations through enhanced messaging with persistent text and ephemeral VibeChecks.

## User Stories

- As an artist, I want to create a VibeReel by selecting up to 7 semantically similar artworks from a global pool to accompany my photo, so that I can showcase my work in an inspiring artistic context
- As an artist, I want to see "Vibes" counters on my art showing how many times others have included it in their VibeReels, so that I can track my art's popularity and influence
- As a user, I want to have a profile with a bio and grid of my original art photos, so that others can discover my artistic identity
- As a user, I want to view friends' profiles to see their art and bio, so that I can explore their creative work
- As a user, I want to find and add friends by searching usernames, so that I can build my artistic network
- As a user, I want to have conversations that combine persistent text messages with ephemeral VibeChecks, so that I can both discuss art and share quick visual moments
- As a user, I want to send VibeChecks (ephemeral photos) that friends can view once for 30 seconds, so that I can share fleeting artistic moments privately
- As a user, I want a unified Conversations tab showing all my active chats, so that I can easily manage my communications

## Functional Requirements

### Must Have

- **VibeReel Creation**: Upload art photo, browse global pool sorted by semantic similarity, select up to 7 pieces, auto-generate rapid-fire story with attribution
- **Global Art Pool**: Every uploaded art piece automatically enters shared pool for others to discover and use
- **Vibes Counter**: Track and display how many VibeReels include each art piece
- **Artist Profiles**: User bio text + grid display of original art photos with Vibes counters
- **Friend-Based Profile Discovery**: Profiles discoverable only through friends list, searchable by username
- **Friend System**: Add friends via username search, view friends' profiles
- **Unified Conversations**: Single tab replacing Send/Inbox with list of active conversations
- **Text Messaging**: Persistent text conversations between friends
- **VibeChecks**: Ephemeral photo sharing (30-second single view) with viewed status indicators
- **Conversation Initiation**: Start chats from friend list with text or VibeCheck
- **Semantic Art Similarity**: Vector embeddings/LLM-powered art similarity ranking
- **Real-time Messaging**: Instant delivery of text messages and VibeChecks
- **Conversation Ordering**: Sort conversations by most recent activity
- **Profile Art Grid**: Clean display of user's original art pieces
- **VibeCheck UI**: Clear visual indicators for VibeChecks in conversation threads

### Should Have

_No items - all requirements moved to Must Have for MVP_

### Nice to Have

- **Profile Avatars**: User profile pictures beyond bio text
- **Friend Discovery**: Browse friends-of-friends for network expansion
- **Public Profile Discovery**: Browse/search all profiles beyond friend network
- **Local/Filtered Pools**: Geographic or network-based art pool filtering
- **Direct Art Uploads**: Add art to pool without creating VibeReel
- **VibeCheck Expiration**: Time-based expiration for VibeChecks
- **Emoji Reacts**: React to VibeChecks and VibeReels with emoji responses
- **Desktop/Web Version**: Expand beyond mobile to desktop and web platforms
- **Advanced Profile Features**: Extended bio options, art categorization

## Non-Functional Requirements

- **Performance**: VibeReel playback smooth with reasonable transitions; art similarity search functional for MVP scale
- **Scalability**: Handle modest user base (1k-10k users) with basic performance
- **Real-time**: Message delivery functional for small user base
- **Storage**: Basic image storage and compression
- **Security**: Basic user authentication and data protection
- **Mobile-First**: Optimized for mobile creation and consumption

## Scope

### In Scope

- Core VibeReel creation with semantic similarity matching
- Global art pool with viral sharing mechanics
- Artist profiles with Vibes counter popularity system
- Enhanced messaging combining persistent text + ephemeral VibeChecks
- Friend system with username-based discovery
- Unified conversation management interface

### Out of Scope

- Monetization features or art sales
- Advanced AI art generation capabilities
- Video VibeReels (photo-only for MVP)
- Public commenting or social features beyond VibeReels
- Advanced privacy controls
- Real-time collaborative VibeReel creation
- Integration with external platforms
- Advanced scalability optimizations
