import { getSupabaseClient } from './supabase-client';

export interface Activity {
  id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Log a user activity
 */
export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('No session found, skipping activity log');
      return;
    }

    const { error } = await supabase
      .from('activities')
      // @ts-expect-error - Singleton pattern causes type inference issues
      .insert({
        user_id: session.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || null
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

/**
 * Get recent activities for the current user
 */
export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return [];
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch activities:', err);
    return [];
  }
}

/**
 * Format activity time for display (e.g., "Just now", "5 minutes ago")
 */
export function formatActivityTime(timestamp: string): string {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now.getTime() - activityTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return activityTime.toLocaleDateString();
}
