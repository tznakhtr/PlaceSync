import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import { useNotifications } from '../hooks/useNotifications';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';
import { ForbiddenState } from '../components/common/ForbiddenState';
import { usePageTitle } from '../hooks/usePageTitle';
import { NotificationItem } from '../components/notifications/NotificationItem';

/**
 * NotificationsPage:
 * Dedicated full-page view for student and placement cell notifications.
 * Provides tabs ("All" vs "Unread"), paginated history, and bulk "Mark all as read" capability.
 */
export const NotificationsPage: React.FC = () => {
  usePageTitle('Notifications');
  const { user } = useAuth();
  const { success } = useToast();
  const { unreadCount } = useUnreadCount();

  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') === 'unread' ? 'unread' : 'all';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const isUnreadOnly = filterParam === 'unread';

  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
    isPlaceholderData,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications({
    unreadOnly: isUnreadOnly,
    page: pageParam,
    limit: 20,
  });

  const handleTabChange = (newFilter: 'all' | 'unread') => {
    if (newFilter === filterParam) return;
    const newParams = new URLSearchParams(searchParams);
    if (newFilter === 'unread') {
      newParams.set('filter', 'unread');
    } else {
      newParams.delete('filter');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleMarkAll = async () => {
    try {
      const res = await markAllAsRead();
      if (res && res.updated > 0) {
        success(`${res.updated} notification${res.updated === 1 ? '' : 's'} marked as read`);
      }
    } catch {
      // Toast error handled inside useNotifications hook
    }
  };

  const notifications = notificationsData?.data || [];
  const meta = notificationsData?.meta;

  const roleEmptyMessage =
    user?.role === 'CELL'
      ? 'You will be notified when students apply or updates occur.'
      : 'You will receive updates on new drives, applications, and results here.';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Notifications</h1>
            {isPlaceholderData && (
              <span className="text-xs text-grey-400 font-medium animate-pulse">Updating...</span>
            )}
          </div>
          <p className="text-sm text-grey-500 mt-1">
            Stay updated on campus placement drives, applications, and announcements.
          </p>
        </div>

        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || isMarkingAllRead}
            isLoading={isMarkingAllRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-grey-200 pb-3">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer ${
            filterParam === 'all'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-grey-600 hover:text-navy-900 hover:bg-grey-100'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('unread')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer ${
            filterParam === 'unread'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-grey-600 hover:text-navy-900 hover:bg-grey-100'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filterParam === 'unread'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-navy-100 text-navy-800'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <Card padding="none" className="divide-y divide-grey-100 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </Card>
      ) : isError ? (
        (error as { response?: { status?: number } })?.response?.status === 403 ? (
          <ForbiddenState message="You do not have access to view notifications." />
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-1">Failed to load notifications</h3>
            <p className="text-sm text-grey-500 max-w-md mb-6">
              {error instanceof Error ? error.message : 'An unexpected error occurred while fetching your notifications.'}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry
            </Button>
          </Card>
        )
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={isUnreadOnly ? <CheckCheck className="w-6 h-6 text-emerald-600" /> : <Bell className="w-6 h-6 text-navy-400" />}
          title={isUnreadOnly ? "You're all caught up" : "No notifications yet"}
          description={isUnreadOnly ? "No unread notifications at the moment." : roleEmptyMessage}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-grey-100">
            {notifications.map((item) => (
              <NotificationItem key={item.id} notification={item} />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalCount={meta.total}
              itemLabel="notification"
              itemLabelPlural="notifications"
              onPageChange={handlePageChange}
              isLoading={isPlaceholderData}
            />
          )}
        </Card>
      )}
    </div>
  );
};
