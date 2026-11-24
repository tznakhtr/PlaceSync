import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { NotificationItem } from '../../../components/notifications/NotificationItem';
import { useNotifications } from '../../../hooks/useNotifications';
import { getErrorMessage } from '../../../utils/getErrorMessage';

/**
 * RecentNotificationsWidget:
 * Shows the 5 newest notifications with interactive read & navigation behavior.
 */
export const RecentNotificationsWidget: React.FC = () => {
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications({
    limit: 5,
  });

  if (isLoading) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-grey-200">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="divide-y divide-grey-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card padding="md" className="text-center py-6">
        <p className="text-xs text-danger mb-2 font-medium">
          {getErrorMessage(error, 'Failed to load notifications.')}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      </Card>
    );
  }

  const notifications = notificationsResponse?.data || [];

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="w-6 h-6 text-navy-400" />}
        title="You're all caught up"
        description="No new notifications."
      />
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-grey-200/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 tracking-tight">Recent notifications</h3>
          <p className="text-xs text-grey-500 mt-0.5">Stay informed on drive & application updates</p>
        </div>
        <Link
          to="/student/notifications"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Notification items */}
      <div className="divide-y divide-grey-100">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-grey-50/50 border-t border-grey-100 text-center">
        <Link
          to="/student/notifications"
          className="text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
        >
          View all notifications &rarr;
        </Link>
      </div>
    </Card>
  );
};
