import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../context/useToast';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { NotificationItem } from './NotificationItem';

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

/**
 * NotificationDropdown:
 * Quick-access top-bar dropdown displaying the 8 most recent user notifications,
 * inline mark-all-read action, and a link to the complete notifications view.
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  unreadCount,
}) => {
  const { user } = useAuth();
  const { success } = useToast();

  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications({
    limit: 8,
    enabled: isOpen,
  });

  // Refetch every time the dropdown is toggled open
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  if (!isOpen) return null;

  const notifications = notificationsData?.data || [];
  const fullPageUrl = user?.role === 'CELL' ? '/cell/notifications' : '/student/notifications';
  const emptyMessage =
    user?.role === 'CELL' ? 'No notifications yet' : "You're all caught up";

  const handleMarkAll = async () => {
    try {
      const res = await markAllAsRead();
      if (res && res.updated > 0) {
        success(`${res.updated} notification${res.updated === 1 ? '' : 's'} marked as read`);
      }
    } catch {
      // Error is handled inside hook
    }
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-grey-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      role="region"
      aria-label="Notifications menu"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-grey-200/80 flex items-center justify-between bg-grey-50/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-navy-900 tracking-tight">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-navy-100 text-navy-800">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || isMarkingAllRead}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline disabled:text-grey-400 disabled:no-underline disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>{isMarkingAllRead ? 'Marking...' : 'Mark all read'}</span>
        </button>
      </div>

      {/* Content body */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-grey-100">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-danger">
              {getErrorMessage(error, 'Failed to load notifications.')}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-3 h-3" />}
            >
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5 text-grey-400" />
            </div>
            <p className="text-sm font-semibold text-navy-900">{emptyMessage}</p>
            <p className="text-xs text-grey-400 max-w-[200px] mx-auto">
              New updates regarding placement drives and status changes will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem key={item.id} notification={item} onItemClick={onClose} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-grey-200/80 bg-grey-50/50 text-center">
        <Link
          to={fullPageUrl}
          onClick={onClose}
          className="text-xs font-semibold text-navy-800 hover:text-navy-950 inline-flex items-center gap-1 transition-colors group"
        >
          <span>View all notifications</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
