# SnapConnect Development Scratchpad

## Phase 1 Progress & Lessons Learned

### ✅ Completed: Friends Management System

- **Status**: Fully implemented with real-time updates
- **Key Learning**: Supabase foreign key constraints need explicit naming for relationship queries
- **Pattern Established**: `{table}_{column}_fkey` constraint naming convention

### 🔧 Critical Setup Patterns for Future Features

#### Database Schema Requirements

```sql
-- Always use explicit foreign key constraints
CONSTRAINT snaps_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE

-- Always enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE {table_name};
```

#### Service Query Pattern

```typescript
// Use explicit constraint names in queries
friend_profile:profiles!friendships_friend_id_fkey(*)
```

#### Real-time Subscription Pattern

```typescript
const subscription = supabase
  .channel('{feature}-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: '{table}' }, handler)
  .subscribe();
```

### 🚧 Known Issues to Monitor

1. **Friend Removal Real-time**: Complex OR delete queries don't trigger real-time properly
2. **Empty List Pull-to-refresh**: Only works when list has content

### 🔧 Advanced Patterns Learned

#### Real-time Subscription Optimization

```typescript
// ❌ Bad: Full reload on every change
loadStories(); // Refetches everything

// ✅ Good: Selective updates by event type
const handleStoryChange = payload => {
  if (eventType === 'INSERT') {
    setStories(prev => [newStory, ...prev]);
  } else if (eventType === 'UPDATE') {
    setStories(prev => prev.map(story => (story.id === newStory.id ? newStory : story)));
  }
};
```

#### Navigation State Reset Pattern

```typescript
// ✅ Prevent stuck navigation states across tabs
listeners={({ navigation }) => ({
  tabPress: (e) => {
    e.preventDefault();
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'TabName' }],
    }));
  },
})}
```

#### Component Reusability for Consistent UI

```typescript
// ✅ Extract shared components early to prevent style drift
<TabHeader title="Title" rightElement={<Button />} />
// Prevents header height inconsistencies across tabs
```

#### View Tracking with RLS Considerations

- **Pattern**: Check existing record before INSERT to avoid upsert RLS issues
- **Lesson**: RLS policies must cover all operations (INSERT + UPDATE for upsert)
- **Solution**: Use conditional INSERT or ensure UPDATE policies exist

### ⚠️ Dependency Warnings (Camera System)

1. **expo-av deprecation**: Will be removed in SDK 54, need to migrate to `expo-audio` and `expo-video`
2. **CameraView children warning**: Current implementation puts controls as children inside CameraView, should use absolute positioning instead

### 📋 Next Phase 1 Features (in order)

1. **✅ Camera System** 📸
   - **✅ Photo capture working**
   - **❌ Video recording** (deferred - Android permission issues)
   - **✅ Supabase Storage integration**

2. **✅ Snap Sharing** 📱
   - **✅ Supabase Storage for media files**
   - **✅ Real-time snap delivery**
   - **✅ Status tracking (sent/delivered/opened)**
   - **✅ Friend selection with multi-select**
   - **✅ 5-second photo timer in viewer**
   - **✅ Complete end-to-end flow working**

3. **✅ Stories** 📰
   - **✅ 24-hour auto-expiration**
   - **✅ Snapchat-style stories row in 3 tabs**
   - **✅ Username initials in colored circles**
   - **✅ Real-time story updates**
   - **✅ One story per user (replaces old)**
   - **✅ Reuse SnapViewer for story viewing**
   - **✅ Complete end-to-end flow working**

4. **Simple Filters** 🎭
   - `react-native-image-filter-kit`
   - Post-capture only for MVP

### 🎥 Video Recording - Deferred

- **Issue**: Android microphone permissions causing "Recording was stopped before any data could be produced"
- **Decision**: Focus on photo-only MVP first, revisit video later
- **Files to clean up later**: `CaptureButton.tsx`, `TestRecording.tsx`

### 🏗️ Architecture Decisions Made

- **State Management**: React built-in (useState/useContext) instead of Zustand
- **Real-time**: Supabase Realtime for instant updates
- **Navigation**: React Navigation with 4-tab structure + stack navigators
- **Styling**: React Native StyleSheet with theme constants
- **Media Storage**: Supabase Storage with public URLs

### 🎯 MVP Scope Boundaries

- **No push notifications** (real-time only when app open)
- **No text messages** (visual snaps only)
- **No conversation threads** (individual snaps)
- **Simple color filters only** (no AR/face tracking)

### 📚 Reference Documentation

- Working database schema: `docs/TECH_STACK.md`
- Feature specifications: `docs/PHASE_1.md`
- Constraint naming patterns documented for copy-paste

### 🔄 Development Workflow Established

1. Update `TECH_STACK.md` with proper schema patterns
2. Create migration with explicit constraints
3. Enable realtime publication
4. Build service functions with constraint names
5. Implement UI with real-time subscriptions
6. Test end-to-end flow

### 💡 Performance Notes

- Database indexes are well-planned for query patterns
- Real-time subscriptions have proper cleanup
- Foreign key cascades prevent orphaned data
- RLS policies secure all operations
- **Selective real-time updates**: Update individual items instead of full reloads for better performance
- **Navigation state management**: Use CommonActions.reset() to prevent stuck navigation states across tabs

### 📋 Development TODOs

- **✅ Add linting setup**: Configure ESLint + Prettier for code consistency and quality
- **✅ Video recording cleanup**: Confirmed CaptureButton.tsx and TestRecording.tsx files don't exist
- **✅ Type safety cleanup**: Replaced all problematic `any` types with proper TypeScript types
- **Real-time subscription cleanup**: Fix potential memory leaks in inbox/sent screens

### 🚀 Ready for Next Feature

Both snap sharing and stories systems are now complete and working end-to-end! The core social functionality is fully implemented. Next Phase 1 feature to implement:

1. **Simple Filters** (color effects for photos/videos)

### 🎉 Major Milestone Achieved

SnapConnect now has complete social functionality with polished UX:

- ✅ **Friends Management**: Add, accept, remove friends
- ✅ **Photo Capture**: Camera with photo taking and initialization fixes
- ✅ **Snap Sharing**: Send photos to selected friends
- ✅ **Stories**: 24-hour posts with read tracking and visual indicators
- ✅ **Real-time Updates**: Optimized selective updates for all interactions
- ✅ **4-Tab Navigation**: Consistent headers with proper state management
- ✅ **Performance Optimized**: Selective real-time updates, proper navigation resets
- ✅ **Visual Polish**: Story read indicators, aligned components, consistent styling
