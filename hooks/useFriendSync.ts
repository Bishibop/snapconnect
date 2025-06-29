import { useEffect, useRef } from 'react';
import { useFriendsContext } from '../contexts/FriendsContext';
import { useVibeReelsContext } from '../contexts/VibeReelsContext';

/**
 * Syncs friend IDs from FriendsContext to VibeReelsContext
 * This enables client-side filtering of vibe reels without database queries
 */
export function useFriendSync() {
  const { friends } = useFriendsContext();
  const { updateFriendIds } = useVibeReelsContext();
  const previousFriendIdsRef = useRef<string[]>([]);

  useEffect(() => {
    // Extract friend IDs
    const friendIds = friends.map(f => f.friend_id);
    
    // Only update if friend IDs actually changed
    const friendIdsChanged = 
      friendIds.length !== previousFriendIdsRef.current.length ||
      friendIds.some((id, index) => id !== previousFriendIdsRef.current[index]);
    
    if (friendIdsChanged) {
      console.log('[FRIEND SYNC] Updating vibe reels context with friend IDs:', friendIds.length);
      updateFriendIds(friendIds);
      previousFriendIdsRef.current = friendIds;
    }
  }, [friends, updateFriendIds]);
}