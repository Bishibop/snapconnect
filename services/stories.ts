import { supabase } from '../lib/supabase';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  snap_type: 'photo' | 'video';
  filter_type?: string;
  duration?: number;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  user_profile?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  is_viewed?: boolean; // Whether current user has viewed this story
}

export interface CreateStoryParams {
  mediaUrl: string;
  snapType: 'photo' | 'video';
  filterType?: string;
  duration?: number;
}

// Create a new story (replaces existing active story)
export async function createStory(params: CreateStoryParams): Promise<Story> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, deactivate any existing active story for this user
  await supabase
    .from('stories')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Create the new story
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      media_url: params.mediaUrl,
      snap_type: params.snapType,
      filter_type: params.filterType,
      duration: params.duration,
      is_active: true,
    })
    .select(`
      *,
      user_profile:profiles!stories_user_id_fkey(*)
    `)
    .single();

  if (error) {
    console.error('Error creating story:', error);
    throw error;
  }

  return data;
}

// Get all active stories from friends with view status
export async function getStoriesFromFriends(): Promise<Story[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get stories from friends with view status
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      user_profile:profiles!stories_user_id_fkey(*),
      story_views!story_views_story_id_fkey(viewer_id)
    `)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .or(`user_id.eq.${user.id},user_id.in.(${await getFriendIds(user.id)})`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
    throw error;
  }

  // Add view status to each story
  const storiesWithViewStatus = (data || []).map(story => ({
    ...story,
    is_viewed: story.story_views?.some((view: any) => view.viewer_id === user.id) || false
  }));

  return storiesWithViewStatus;
}

// Helper function to get friend IDs for the current user
async function getFriendIds(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friend IDs:', error);
    return '';
  }

  const friendIds = data.map(f => f.friend_id).join(',');
  return friendIds || 'null'; // Return 'null' if no friends to avoid SQL error
}

// Get current user's active story
export async function getCurrentUserStory(): Promise<Story | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      user_profile:profiles!stories_user_id_fkey(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching user story:', error);
    throw error;
  }

  return data || null;
}

// Deactivate a story (soft delete)
export async function deactivateStory(storyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('stories')
    .update({ is_active: false })
    .eq('id', storyId)
    .eq('user_id', user.id); // Ensure user can only deactivate their own stories

  if (error) {
    console.error('Error deactivating story:', error);
    throw error;
  }
}

// Mark a story as viewed
export async function markStoryViewed(storyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if already viewed
  const { data: existingView } = await supabase
    .from('story_views')
    .select('id')
    .eq('story_id', storyId)
    .eq('viewer_id', user.id)
    .single();

  // Only insert if not already viewed
  if (!existingView) {
    const { error } = await supabase
      .from('story_views')
      .insert({
        story_id: storyId,
        viewer_id: user.id,
        viewed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error marking story as viewed:', error);
      throw error;
    }
  }
}

// Subscribe to stories changes
export function subscribeToStoriesChanges(
  callback: (payload: any) => void
) {
  return supabase
    .channel('stories-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stories',
      },
      callback
    )
    .subscribe();
}