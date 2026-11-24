import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  getNotifications,
  markAllAsRead as apiMarkAllAsRead,
  markAsRead as apiMarkAsRead,
} from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { getErrorMessage } from '../utils/getErrorMessage';
import type {
  NotificationListResponse,
  QueryNotificationsParams,
  UnreadCountResponse,
} from '../types/notification';

export interface UseNotificationsOptions extends QueryNotificationsParams {
  enabled?: boolean;
}

/**
 * useNotifications:
 * Hook for querying paginated notifications and executing single / bulk read mutations
 * with optimistic cache updates for immediate UI responsiveness.
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, ...queryParams } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { error: toastError } = useToast();

  // Paginated notifications query
  const query = useQuery({
    queryKey: ['notifications', queryParams],
    queryFn: () => getNotifications(queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(user && enabled),
  });

  // Single mark-as-read mutation with optimistic cache update
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiMarkAsRead(id),
    onMutate: async (id: number) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot previous unread count
      const previousUnread = queryClient.getQueryData<UnreadCountResponse>([
        'notifications-unread-count',
      ]);

      // Optimistically decrement badge count
      if (previousUnread && previousUnread.count > 0) {
        queryClient.setQueryData<UnreadCountResponse>(['notifications-unread-count'], {
          count: Math.max(0, previousUnread.count - 1),
        });
      }

      // Optimistically update isRead flag across all active notification lists
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
          };
        },
      );

      return { previousUnread };
    },
    onError: (err: unknown, _id, context) => {
      // If 404, the notification is already gone or handled; don't alert the user
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        return;
      }

      // Rollback unread count on network/server error
      if (context?.previousUnread) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousUnread);
      }
      toastError(getErrorMessage(err, 'Failed to mark notification as read.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: apiMarkAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousUnread = queryClient.getQueryData<UnreadCountResponse>([
        'notifications-unread-count',
      ]);

      // Optimistically set count to 0
      queryClient.setQueryData<UnreadCountResponse>(['notifications-unread-count'], {
        count: 0,
      });

      // Optimistically mark all cached notifications as read
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ['notifications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) => ({ ...item, isRead: true })),
          };
        },
      );

      return { previousUnread };
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previousUnread) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousUnread);
      }
      toastError(getErrorMessage(err, 'Failed to mark all notifications as read.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  return {
    ...query,
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    isMarkingRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
