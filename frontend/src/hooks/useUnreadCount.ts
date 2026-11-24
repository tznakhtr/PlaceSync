import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

/**
 * useUnreadCount:
 * Polls for unread notifications count every 30 seconds while the browser tab is focused.
 * Scoped to authenticated users only; retains last known count if polling encounters an error.
 */
export function useUnreadCount() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadCount,
    enabled: Boolean(user),
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: false, // only when tab is active/visible
    refetchOnWindowFocus: true,
    retry: false, // do not retry aggressively or block UI on polling failure
  });

  return {
    unreadCount: query.data?.count ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
