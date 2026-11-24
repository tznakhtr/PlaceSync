import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Briefcase, FileCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDateTime, formatRelativeTime } from '../../utils/format';
import { getNotificationLink } from '../../utils/notificationRoutes';
import type { Notification, NotificationType } from '../../types/notification';

export interface NotificationItemProps {
  notification: Notification;
  onItemClick?: () => void;
}

const typeIconMap: Record<NotificationType, React.ReactNode> = {
  NEW_DRIVE: <Briefcase className="w-4 h-4 text-navy-700" />,
  APPLICATION_SUBMITTED: <FileCheck className="w-4 h-4 text-emerald-700" />,
  STATUS_UPDATE: <TrendingUp className="w-4 h-4 text-navy-800" />,
  RESULT_PUBLISHED: <Award className="w-4 h-4 text-emerald-800" />,
};

const typeBgMap: Record<NotificationType, string> = {
  NEW_DRIVE: 'bg-navy-100',
  APPLICATION_SUBMITTED: 'bg-emerald-100',
  STATUS_UPDATE: 'bg-navy-100',
  RESULT_PUBLISHED: 'bg-emerald-100',
};

/**
 * NotificationItem:
 * Individual notification item rendered inside the top-bar dropdown and the full page.
 * Distinguishes unread items with a navy-50 background, bold text, and emerald indicator dot.
 * On click, marks as read and navigates if a destination URL applies for the user's role.
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onItemClick,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  const isUnread = !notification.isRead;
  const link = getNotificationLink(notification, user?.role);
  const isInteractive = Boolean(link) || isUnread;

  const handleClick = () => {
    // Optimistically mark as read if currently unread
    if (isUnread) {
      markAsRead(notification.id);
    }

    onItemClick?.();

    if (link) {
      navigate(link);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const iconNode = typeIconMap[notification.type] || <Briefcase className="w-4 h-4 text-navy-700" />;
  const iconBg = typeBgMap[notification.type] || 'bg-navy-100';

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`p-3.5 flex items-start gap-3 transition-colors text-left ${
        isInteractive ? 'cursor-pointer' : ''
      } ${
        isUnread
          ? 'bg-navy-50/70 hover:bg-navy-100/50'
          : 'bg-surface hover:bg-grey-50/70'
      }`}
    >
      {/* Type Icon Badge */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
      >
        {iconNode}
      </div>

      {/* Message and Timestamp */}
      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={`text-xs leading-relaxed text-navy-900 ${
            isUnread ? 'font-semibold' : 'font-normal'
          }`}
        >
          {notification.message}
        </p>

        <div className="flex items-center gap-2 text-[11px] text-grey-400">
          <time
            dateTime={notification.createdAt}
            title={formatDateTime(notification.createdAt)}
            className="hover:underline"
          >
            {formatRelativeTime(notification.createdAt)}
          </time>

          {isUnread && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>New</span>
              <span className="sr-only">Unread notification</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
