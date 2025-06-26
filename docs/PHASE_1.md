# SnapConnect Phase 1

## Navigation & App Structure

### Overview

Simple navigation structure focused on the camera-first experience with easy access to social features.

### Main Navigation

**Tab Bar Navigation (Bottom):**

1. **Friends** - Friend list and requests
2. **Camera** - Main camera screen (default/home)
3. **Inbox** - Received snaps and stories
4. **Sent** - Sent snaps with status tracking

### Screen Hierarchy

**Camera Tab (Center/Default):**

- Opens directly to camera view
- "X" button to close camera → returns to last tab
- After capture → Media Preview → Send/Story options

**Friends Tab:**

- Friends List (main screen)
- → Add Friends (search screen)
- → Friend Requests (pending requests)

**Inbox Tab:**

- Mixed feed of snaps and stories
- Tap item → Full-screen viewer
- Auto-return to inbox after viewing

**Sent Tab:**

- List of sent snaps with status
- Real-time status updates
- No interaction, view-only

### User Flow

**App Launch:**

1. Opens to Camera (center tab)
2. User can immediately capture content
3. Swipe or tap to access other features

**Core Navigation Principles:**

- Camera is always one tap away
- No deep navigation hierarchies
- Modal viewers for full-screen content
- Automatic returns after time-based actions

### Phase 1 Limitations

- No app drawer or hamburger menu
- No search/discover tab
- No chat tab (since no conversations)
- No profile tab (minimal profile features)

## 1. 👥 Friend Management

### Overview

Basic friend system enabling users to find, add, and manage friendships as the foundation for messaging and social features.

### Core Features

- **User Search**: Find other users by exact username
- **Friend Requests**: Send, receive, accept, and decline friend requests
- **Friends List**: View and manage current friends
- **Request Management**: Track pending sent and received requests

### User Experience

**Adding a Friend:**

1. User goes to "Add Friends" screen
2. Searches for another user by username
3. Taps "Add Friend" on search result
4. Friend request is sent and shows as "pending"

**Managing Friend Requests:**

1. User checks "Friend Requests" screen (no automatic notifications)
2. Reviews incoming requests with accept/decline options
3. Real-time updates when new requests arrive (if app is open)
4. Accepted friends appear in friends list

**Friends List:**

1. View all current friends by username
2. Basic "Remove Friend" option for each friend
3. Simple list interface

### Technical Implementation

**Database Schema:**

- `friendships` table with user_id, friend_id, status (pending/accepted)
- Query `profiles` table for user search
- Row Level Security policies for friend privacy

**Key Components:**

- `FriendsListScreen.tsx` - Display current friends
- `AddFriendsScreen.tsx` - Search and add friends
- `FriendRequestsScreen.tsx` - Manage pending requests
- `FriendItem.tsx` - Individual friend display component

**API Functions:**

- Search users by username
- Send/accept/decline friend requests
- Remove friends
- Get friends list and request counts

### Phase 1 Limitations

- Username search only (no display name search)
- No friend suggestions or recommendations
- No contact syncing or QR codes
- No block/unblock functionality
- No online status indicators
- No friend categories or grouping

## 2. 📸 Camera System

### Overview

Simple photo and video capture system with essential functionality for creating content to share with friends.

### Core Features

- **Dual Capture Mode**: Tap for photo, hold for video recording
- **Camera Switching**: Toggle between front and rear cameras
- **Live Preview**: Full-screen camera preview with minimal UI
- **Media Preview**: Review captured content before sending

### User Experience

**Photo Capture:**

1. User taps capture button
2. Photo is taken instantly
3. Preview screen shows captured photo
4. Options: "Retake" or "Use Photo"

**Video Recording:**

1. User holds capture button to start recording
2. Visual recording indicator and timer appear
3. Recording stops when button is released
4. Preview screen with play button to review video
5. Options: "Retake" or "Use Video"

### Technical Implementation

**Dependencies Required:**

- `expo-camera` - Camera access and media capture
- `expo-av` - Video playback in preview

**Key Components:**

- `CameraScreen.tsx` - Main camera interface
- `MediaPreview.tsx` - Preview photos and videos
- `CaptureButton.tsx` - Handle tap vs hold gestures

**Specifications:**

- Maximum video length: 60 seconds
- Automatic quality optimization
- Standard photo resolution
- Basic camera permissions handling

### Phase 1 Limitations

- No flash controls
- No zoom or manual focus
- No video editing or trimming
- No multiple quality options
- No advanced camera modes

## 3. 📸 Real-time Visual Snap Sharing

### Overview

Visual-only ephemeral messaging system for sharing photos and videos with optional text overlays. All communication happens through visual media snaps sent to friends without persistent conversation threading.

### Core Features

- **Visual Snaps Only**: Photos and videos only (no standalone text messages)
- **Text Overlays**: Add text captions and drawings on top of visual media
- **Snap-Based Delivery**: Individual media snaps, not conversation threads
- **Real-time Delivery**: Instant snap transmission using Supabase Realtime
- **Snap Status Tracking**: Track sent, delivered, and opened status

### User Experience

**Snap Inbox Interface:**

1. Main screen shows list of received visual snaps only
2. Each snap shows: "Friend Name sent a [photo/video] • timestamp"
3. Snaps sorted by timestamp (newest first)
4. No conversation threading or text-only messages

**Creating & Sending Snaps:**

1. User captures photo/video with camera
2. No text overlays or editing in Phase 1
3. Selects "Send" and chooses friend(s) from friend list
4. Visual snap delivered instantly to friend's inbox
5. No standalone text messages possible

**Receiving & Viewing Snaps:**

1. Real-time delivery of visual snaps to inbox (when app is open)
2. Snap inbox updates instantly with new snaps
3. Tap snap to view full-screen
4. Status tracking shows when snaps are opened
5. Pure visual communication experience

### Technical Implementation

**Database Schema:**

- `snaps` table: id, sender_id, recipient_id, media_url, snap_type (photo/video), status, created_at
- No conversations table needed (no threading)
- Message status tracking: sent_at, delivered_at, opened_at
- Supabase Storage for media files with secure URLs

**Key Components:**

- `SnapInboxScreen.tsx` - Main list of received visual snaps
- `SnapViewer.tsx` - Full-screen snap viewing
- `FriendSelector.tsx` - Choose recipient(s) for snap

**Snap Types:**

- Photo snaps with optional text overlay
- Video snaps with optional text overlay
- All snaps are visual media (no text-only)

**Real-time Features:**

- Supabase Realtime subscriptions for instant delivery
- Live status updates (sent/delivered/opened)
- Real-time snap inbox updates
- Friend request notifications (when app is open)

### Phase 1 Limitations

- No text overlays or drawing tools
- No snap editing after sending
- No replies or reactions
- No snap forwarding
- No snap saving or permanent storage
- No notifications when app is closed/backgrounded

## 4. ⏰ Disappearing Messages

### Overview

Ephemeral viewing system where all visual snaps disappear after being viewed once. Photos have a 5-second viewing timer, while videos play to completion before disappearing.

### Core Features

- **Photo Timer**: 5-second viewing window for photo snaps with countdown display
- **Video Playback**: Videos play full duration (up to 60 seconds) without timer
- **One-Time Viewing**: All snaps disappear completely after single viewing
- **Complete Removal**: No traces, history, or replay options after viewing
- **Real-time View Tracking**: Live status updates via Supabase Realtime

### User Experience

**Viewing Photo Snaps:**

1. User taps photo snap from inbox
2. Photo displays full-screen
3. 5-second countdown timer starts immediately with visual indicator
4. Photo automatically closes after 5 seconds
5. Snap completely removed from inbox

**Viewing Video Snaps:**

1. User taps video snap from inbox
2. Video plays full-screen
3. Video plays to completion (no artificial timer)
4. Video automatically closes when playback finishes
5. Snap completely removed from inbox

**Checking Snap Views (Sender):**

1. Sender goes to "Sent Snaps" screen
2. List shows recent sent snaps with real-time status:
   - "Friend Name • Photo/Video • Delivered/Opened • timestamp"
3. Status updates instantly when recipient views snap (if app is open)
4. Live updates via Supabase Realtime subscriptions

### Technical Implementation

**Snap States:**

- `sent` - Delivered to recipient's inbox
- `opened` - Recipient has viewed the snap
- `expired` - Snap removed from recipient's inbox after viewing

**Key Components:**

- `PhotoViewer.tsx` - Photo display with 5-second countdown timer
- `VideoViewer.tsx` - Video playback without timer
- `SentSnapsScreen.tsx` - List of sent snaps with live status updates
- `CountdownTimer.tsx` - Visual 5-second countdown for photos

**Real-time Features:**

- Instant snap delivery to recipient's inbox
- Live status updates from "delivered" to "opened"
- Real-time inbox updates when new snaps arrive
- Live sent snaps list updates when views occur
- All powered by Supabase Realtime subscriptions

### Phase 1 Limitations

- No notifications when app is closed/backgrounded
- No screenshot detection or prevention
- No replay functionality
- No timer customization (fixed 5 seconds for photos)
- Real-time updates only work when app is actively open

## 5. 📱 Stories Feature

### Overview

Simple 24-hour visual posts that users can share with all friends at once. Stories appear in the same inbox feed as regular snaps and follow the same viewing mechanics.

### Core Features

- **24-Hour Posts**: Stories automatically expire after 24 hours
- **Visual Content Only**: Photos and videos only (same as snaps)
- **Friend-Wide Sharing**: One story visible to all friends simultaneously
- **Single Story Limit**: One active story per user (new replaces old)
- **Unified Feed**: Stories appear mixed with snaps in main inbox

### User Experience

**Creating a Story:**

1. User captures photo/video with camera
2. After preview, chooses between:
   - "Send to Friend" (creates a snap)
   - "Post to Story" (creates/replaces story)
3. Story immediately visible to all friends
4. No text overlays in Phase 1

**Viewing Stories:**

1. Stories appear in main inbox feed alongside snaps
2. Format: "Friend Name posted a story • timestamp"
3. Tap to view with same behavior as snaps:
   - Photos: 5-second timer
   - Videos: Play to completion
4. Story disappears from viewer's feed after viewing
5. No story sequences or autoplay

**Story Management:**

1. One story per user at any time
2. New story automatically replaces existing story
3. Stories auto-expire after 24 hours
4. No manual deletion option
5. No view tracking or analytics

### Technical Implementation

**Database Schema:**

- `stories` table: id, user_id, media_url, snap_type (photo/video), created_at, expires_at
- Automatic cleanup job for stories older than 24 hours
- Same media storage as snaps

**Key Components:**

- `StoryOption.tsx` - "Post to Story" button in media preview
- `StoryItem.tsx` - Story display in inbox feed
- Same viewer components as snaps (PhotoViewer, VideoViewer)

**Story Logic:**

- Replace existing story when posting new one
- 24-hour expiration timestamp
- Real-time delivery to all friends' inboxes
- Same disappearing behavior as snaps

### Phase 1 Limitations

- No text overlays on stories (coming later)
- No story view count or viewer list
- No story replies or reactions
- No story highlights or saving
- One story at a time per user
- No story-specific creation tools

## 6. 👥 Group Messaging (Multi-Friend Selection)

### Overview

Simple multi-friend snap sending that allows users to send the same snap to multiple friends at once. No group creation or management - just select multiple recipients when sending.

### Core Features

- **Multi-Friend Selection**: Choose multiple friends when sending a snap
- **Individual Delivery**: Each friend receives their own copy of the snap
- **Bulk Sending**: One capture, multiple recipients
- **No Group Identity**: Recipients unaware of other recipients
- **Same Snap Rules**: Standard disappearing behavior applies

### User Experience

**Sending to Multiple Friends:**

1. User captures photo/video with camera
2. After preview, selects "Send to Friends"
3. Friend selection screen allows multiple selections:
   - Checkboxes next to each friend
   - Selected count shown (e.g., "Send to 3 friends")
4. Tap "Send" to deliver to all selected friends
5. Each friend receives individual snap in their inbox

**Receiving Experience:**

1. Snap appears as normal: "Friend Name sent a [photo/video]"
2. No indication it was sent to others
3. Same viewing behavior (5-second timer or video duration)
4. Snap disappears after viewing
5. Standard delivered/opened status tracking

**Sent Snaps Tracking:**

1. Sent snaps list shows one entry per recipient
2. Individual status tracking for each copy
3. Can see which friends have opened vs delivered

### Technical Implementation

**Database Logic:**

- Create separate snap record for each recipient
- No groups table or group management needed
- Same snaps table structure, just multiple inserts

**Key Components:**

- `FriendMultiSelector.tsx` - Friend list with checkboxes
- `SendButton.tsx` - Shows selected count and sends to multiple
- No new viewer components needed

**Sending Logic:**

```javascript
// For each selected friend, create individual snap
selectedFriends.forEach(friendId => {
  createSnap({ recipientId: friendId, mediaUrl, ... })
})
```

### Phase 1 Limitations

- No persistent groups or group names
- No group management (add/remove members)
- Recipients don't see who else received the snap
- No group-specific features or group identity
- Maximum recipients limited for performance (e.g., 20 friends)
- No "reply all" functionality

## 7. 🎭 Simple AR Filters & Effects

### Overview

Basic color filters that users can apply to photos and videos after capture. Simple visual effects to enhance snaps before sending, without complex AR or face tracking.

### Core Features

- **Post-Capture Filters**: Apply filters after taking photo/video
- **Basic Color Filters**: 5-6 simple filters for visual variety
- **Filter Preview**: See effect before sending
- **Quick Selection**: Swipe or tap through filter options
- **No Face Tracking**: Color adjustments only in Phase 1

### User Experience

**Applying Filters:**

1. User captures photo/video
2. After preview, new "Filters" button appears
3. Tap filters to see selection:
   - Original (no filter)
   - B&W (grayscale)
   - Sepia (vintage brown)
   - Cool (blue tint)
   - Warm (orange tint)
   - High Contrast
4. Tap filter to preview effect on media
5. Select filter and continue to send

**Filter Selection UI:**

1. Horizontal filter carousel at bottom
2. Small preview thumbnails of each filter
3. Tap to apply, tap again to remove
4. Visual indicator of selected filter

### Technical Implementation

**Dependencies:**

- `react-native-image-filter-kit` - Cross-platform filter library

**Filter Implementation:**

```javascript
// Example B&W filter
<ColorMatrix
  matrix={[0.3, 0.59, 0.11, 0, 0, 0.3, 0.59, 0.11, 0, 0, 0.3, 0.59, 0.11, 0, 0, 0, 0, 0, 1, 0]}
  image={<Image source={capturedMedia} />}
/>
```

**Key Components:**

- `FilterSelector.tsx` - Filter carousel UI
- `FilterPreview.tsx` - Live preview with selected filter
- `FilteredImage.tsx` - Image component with filter applied
- `FilteredVideo.tsx` - Video component with filter applied

**Available Filters:**

1. Original - No modifications
2. B&W - Grayscale conversion
3. Sepia - Vintage brown tone
4. Cool - Blue color temperature
5. Warm - Orange color temperature
6. High Contrast - Increased contrast and saturation

### Phase 1 Limitations

- No live camera preview with filters
- No face detection or AR masks
- No custom filter creation
- No filter intensity adjustments
- Filters applied to entire image only
- No animated or time-based effects

---

## Summary

Phase 1 includes 7 core features that create a complete Snapchat-like experience:

1. **Friend Management** - Find and connect with friends
2. **Camera System** - Capture photos and videos
3. **Real-time Visual Snap Sharing** - Send visual content instantly
4. **Disappearing Messages** - Ephemeral viewing with timers
5. **Stories Feature** - 24-hour broadcasts to all friends
6. **Group Messaging** - Send snaps to multiple friends
7. **Simple AR Filters** - Basic color effects

All features work together to create a cohesive ephemeral messaging app with real-time updates powered by Supabase.
