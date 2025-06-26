# SnapConnect MVP Epic Brief

## Overview
SnapConnect is an ephemeral messaging app similar to Snapchat, built with React Native and Supabase, focusing on disappearing photos, real-time social features, and simple filters.

## User Stories

### Core Messaging
- As a user, I want to take photos and send them to friends so that I can share moments that disappear
- As a user, I want to receive photos from friends and view them for 5 seconds so that I can see what they're sharing
- As a user, I want to see when my snaps are delivered and opened so that I know my friends saw them

### Friends Management
- As a user, I want to search for friends by username so that I can connect with people I know
- As a user, I want to send and receive friend requests so that I can control who I share with
- As a user, I want to see my friends list so that I can manage my connections

### Stories
- As a user, I want to post photos to my story so that all my friends can see them for 24 hours
- As a user, I want to view my friends' stories so that I can see what they're up to
- As a user, I want to see who viewed my story so that I know who's interested

### Camera & Filters
- As a user, I want to switch between front and rear cameras so that I can take selfies or photos
- As a user, I want to apply simple filters to my photos so that I can enhance them before sharing

## Functional Requirements

### Must Have
- User authentication (signup/login)
- Friend system (search, request, accept/decline)
- Photo capture with camera switching
- Send photos to selected friends
- 5-second viewing timer for received snaps
- Snap status tracking (sent/delivered/opened)
- Stories that expire after 24 hours
- Story view tracking
- Simple color filters (B&W, Sepia, Warm, Cool, etc.)
- Real-time updates for all social interactions

### Should Have
- Pull-to-refresh on lists
- Empty state messaging
- Loading states during operations
- Error handling with user feedback
- Consistent UI/UX across the app

### Nice to Have
- Video recording (deferred due to Android issues)
- Push notifications
- Text messaging
- AR filters
- Group messaging

## Non-Functional Requirements

### Performance
- Instant camera initialization
- Smooth navigation between screens
- Real-time updates within 1 second
- No loading flickers when switching tabs

### Security
- Row Level Security on all database tables
- Secure authentication tokens
- Media files accessible only to authorized users
- Cache clearing on logout

### Scalability
- Efficient database queries with proper indexes
- Lazy loading of images
- Pagination for friend lists
- Automatic cleanup of expired content

### Reliability
- Graceful error handling
- Offline capability for viewing cached content
- Automatic retry for failed operations

## Scope

### In Scope
- Complete friends management system
- Photo capture and sharing
- Disappearing messages (5-second timer)
- 24-hour stories with view tracking
- Simple post-capture filters
- 4-tab navigation structure
- Real-time updates via WebSockets
- Cross-platform (iOS and Android)

### Out of Scope
- Push notifications
- Video recording/sharing
- Text messaging
- AR/face tracking filters
- Group chats
- Chat history/threads
- User blocking
- Content reporting
- Analytics
- Monetization features

## Success Metrics

### User Engagement
- Users can complete full signup flow
- Users successfully add at least one friend
- Users send their first snap within 5 minutes
- 90% of snaps are viewed within 1 hour

### Technical Performance
- App startup time under 3 seconds
- Camera initialization under 1 second
- Real-time updates delivered within 1 second
- Zero critical crashes in core flows

### Feature Adoption
- 80% of users who add friends send a snap
- 60% of active users post a story
- 70% of users apply filters to their photos
- 95% snap delivery success rate