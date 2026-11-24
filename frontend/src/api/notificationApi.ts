import apiClient from './axios';
import type {
  MarkAllReadResponse,
  Notification,
  NotificationListResponse,
  QueryNotificationsParams,
  UnreadCountResponse,
} from '../types/notification';

/**
 * Fetch paginated in-app notifications for the authenticated user.
 * GET /notifications
 */
export const getNotifications = async (
  params: QueryNotificationsParams = {},
): Promise<NotificationListResponse> => {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.unreadOnly) {
    queryParams.unreadOnly = true;
  }
  if (params.page !== undefined && params.page > 0) {
    queryParams.page = params.page;
  }
  if (params.limit !== undefined && params.limit > 0) {
    queryParams.limit = params.limit;
  }

  const response = await apiClient.get<NotificationListResponse>('/notifications', {
    params: queryParams,
  });
  return response.data;
};

/**
 * Get count of unread notifications for the authenticated user.
 * GET /notifications/unread-count
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a single notification as read.
 * PATCH /notifications/:id/read
 */
export const markAsRead = async (id: number): Promise<Notification> => {
  const response = await apiClient.patch<Notification>(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications for the authenticated user as read.
 * PATCH /notifications/read-all
 */
export const markAllAsRead = async (): Promise<MarkAllReadResponse> => {
  const response = await apiClient.patch<MarkAllReadResponse>('/notifications/read-all');
  return response.data;
};
