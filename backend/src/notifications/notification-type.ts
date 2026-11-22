/**
 * In-app notification types in PlaceSync.
 * Stored as a string in the type column of the Notification database model.
 */
export const NotificationType = {
  NEW_DRIVE: 'NEW_DRIVE',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  STATUS_UPDATE: 'STATUS_UPDATE',
  RESULT_PUBLISHED: 'RESULT_PUBLISHED',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
