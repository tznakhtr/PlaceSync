/**
 * Types for notifications across STUDENT and CELL portals.
 */

export type NotificationType =
  | 'NEW_DRIVE'
  | 'APPLICATION_SUBMITTED'
  | 'STATUS_UPDATE'
  | 'RESULT_PUBLISHED';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  driveId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllReadResponse {
  updated: number;
}

export interface QueryNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
