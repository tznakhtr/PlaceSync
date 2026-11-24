import type { Notification } from '../types/notification';
import type { Role } from '../types';

/**
 * Resolves the navigation destination URL when a user clicks on an in-app notification.
 *
 * STUDENT:
 * - NEW_DRIVE with driveId: /student/drives/:driveId
 * - APPLICATION_SUBMITTED, STATUS_UPDATE, RESULT_PUBLISHED: /student/applications
 * - Any notification missing a needed ID or unknown type: null (no navigation)
 *
 * CELL:
 * - null (no navigation)
 */
export function getNotificationLink(
  notification: Notification,
  role: Role | string | undefined,
): string | null {
  if (role !== 'STUDENT') {
    return null;
  }

  switch (notification.type) {
    case 'NEW_DRIVE':
      return notification.driveId ? `/student/drives/${notification.driveId}` : null;
    case 'APPLICATION_SUBMITTED':
    case 'STATUS_UPDATE':
    case 'RESULT_PUBLISHED':
      return '/student/applications';
    default:
      return null;
  }
}
