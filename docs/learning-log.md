# Project Learning Log

## Decision Journal

_Record major technical decisions, reasoning, and outcomes_

### State Management: React Built-in vs Zustand

**Decision**: Use React's built-in state management (useState, useContext)
**Reasoning**:

- Simpler to understand and maintain
- No additional dependencies
- Sufficient for current app complexity
- Can migrate to Zustand later if needed
  **Outcome**: Working well, no performance issues. Custom hooks provide good abstraction.

### Real-time Updates: Full Reload vs Selective Updates

**Decision**: Implement selective updates for real-time changes
**Reasoning**:

- Better performance with less data transfer
- Smoother UX without full list refreshes
- More complex but worth the effort
  **Outcome**: Significant performance improvement, especially noticeable in stories and friend lists.

### Video Recording Deferral

**Decision**: Defer video recording to focus on photo-only MVP
**Reasoning**:

- Android microphone permission issues
- Photo-only still delivers core value
- Can revisit after MVP success
  **Outcome**: Faster time to feature-complete MVP, no user complaints about missing video initially.

---

## Reusable Patterns

_Document solutions and approaches that can be reused_

### Synchronous Cache Initialization

```typescript
const [data, setData] = useState<T[]>(() => {
  if (!user?.id) return [];
  return cache.get<T[]>(CACHE_KEY, user.id, CACHE_DURATION) || [];
});
```

**Use Case**: Eliminate loading states when switching tabs
**Benefits**: Instant UI, better perceived performance

### Real-time Subscription with Cleanup

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('feature-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, handler)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**Use Case**: Any feature needing live updates
**Benefits**: Proper cleanup prevents memory leaks

### Navigation State Reset Pattern

```typescript
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

**Use Case**: Prevent navigation stack issues in tab navigation
**Benefits**: Clean navigation state, no stuck screens

### Foreign Key Constraint Pattern

```sql
CONSTRAINT table_column_fkey FOREIGN KEY (column) REFERENCES other_table(id) ON DELETE CASCADE
```

**Use Case**: All foreign key relationships
**Benefits**: Consistent naming enables proper Supabase queries

---

## Experiments & Results

_Track tests, prototypes, and their outcomes_

### Camera Children Warning Fix

**Problem**: Expo Camera deprecation warning about children
**Experiment**: Move controls outside CameraView with absolute positioning
**Result**: ✅ Warning eliminated, exact same visual appearance

### AppState vs setInterval for Cache Cleanup

**Problem**: Memory leaks from global intervals
**Experiment**: Replace with AppState change listeners
**Result**: ✅ Proper cleanup on app background, no more memory leaks

### Atomic Cache Operations

**Problem**: Race conditions when multiple updates happen quickly
**Experiment**: Implement update function pattern instead of get/set
**Result**: ✅ No more inconsistent state, cleaner code

### Empty List Pull-to-Refresh

**Problem**: RefreshControl only works with ScrollView content
**Experiment**: Always render FlatList, use ListEmptyComponent
**Result**: ⚠️ Works but requires careful styling to prevent layout issues

---

## Epic Retrospectives

_Capture what went well and what didn't after each epic_

### Phase 1: Core Social Platform

#### What Went Well

- **Architecture Decisions**: Clean separation of concerns made features easy to add
- **Real-time Integration**: Supabase Realtime worked flawlessly once patterns established
- **Performance**: Cache layer prevented any performance issues
- **Code Quality**: TypeScript caught many bugs early
- **Documentation**: Good docs made it easy to resume work

#### What Could Be Improved

- **Testing**: Should have added tests earlier in development
- **Video Planning**: Should have tested Android video permissions earlier
- **Component Reuse**: Some duplicate code could have been extracted earlier
- **Error Messages**: Need more user-friendly error messages

#### Key Learnings

1. **Always test device permissions early** - Would have saved time on video feature
2. **Establish patterns early** - Foreign key naming, real-time subscriptions, etc.
3. **Performance optimization can be iterative** - Started simple, optimized based on real usage
4. **Documentation during development pays off** - SCRATCHPAD.md was invaluable

#### Action Items for Next Epic

- [ ] Add basic test coverage before starting Phase 2
- [ ] Create error message constants file
- [ ] Extract more shared components
- [ ] Research AR frameworks early
- [ ] Plan for offline mode

---
