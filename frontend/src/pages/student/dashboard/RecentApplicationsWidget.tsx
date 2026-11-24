import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getMyApplications } from '../../../api/applicationApi';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';

/**
 * RecentApplicationsWidget:
 * Lists the 5 newest submitted applications with status badges and drive links.
 */
export const RecentApplicationsWidget: React.FC = () => {
  const {
    data: applicationsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-applications', { limit: 50 }],
    queryFn: () => getMyApplications({ limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-grey-200">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="divide-y divide-grey-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
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
          {getErrorMessage(error, 'Failed to load recent applications.')}
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

  const applications = applicationsResponse?.data || [];

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-6 h-6 text-navy-400" />}
        title="No applications yet"
        description="You have not applied to any drive yet."
        action={
          <Link to="/student/drives">
            <Button variant="primary" size="sm">
              Explore drives
            </Button>
          </Link>
        }
      />
    );
  }

  const recentApplications = applications.slice(0, 5);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-grey-200/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 tracking-tight">Recent applications</h3>
          <p className="text-xs text-grey-500 mt-0.5">Your latest placement drive submissions</p>
        </div>
        <Link
          to="/student/applications"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-grey-100">
        {recentApplications.map((app) => (
          <div
            key={app.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-grey-50/50 transition-colors"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-navy-900 truncate">
                  {app.drive.companyName}
                </span>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-xs text-grey-500 truncate">{app.drive.role}</p>
              <p className="text-[11px] text-grey-400">
                Applied on {formatDateTime(app.appliedAt)}
              </p>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Link to={`/student/drives/${app.drive.id}`}>
                <Button variant="secondary" size="sm">
                  View drive
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-grey-50/50 border-t border-grey-100 text-center">
        <Link
          to="/student/applications"
          className="text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
        >
          View all applications &rarr;
        </Link>
      </div>
    </Card>
  );
};
