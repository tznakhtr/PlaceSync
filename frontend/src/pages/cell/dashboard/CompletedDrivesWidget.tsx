import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getDrives } from '../../../api/driveApi';
import { formatDateTime } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';

/**
 * CompletedDrivesWidget:
 * Shows the last 5 completed drives (most recent first) with results viewing actions.
 */
export const CompletedDrivesWidget: React.FC = () => {
  const {
    data: completedResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['drives', { status: 'COMPLETED', limit: 50 }],
    queryFn: () => getDrives({ status: 'COMPLETED', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Last 5 items of the completed list in reverse order (newest first)
  const completedDrives = useMemo(() => {
    const drives = completedResponse?.data || [];
    return [...drives].reverse().slice(0, 5);
  }, [completedResponse]);

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
          {getErrorMessage(error, 'Failed to load completed drives.')}
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

  if (completedDrives.length === 0) {
    return (
      <EmptyState
        icon={<Award className="w-6 h-6 text-navy-400" />}
        title="No results have been published yet."
        description="Recruitment drives with published hiring results will appear here."
      />
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-grey-200/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 tracking-tight">
            Recently completed drives
          </h3>
          <p className="text-xs text-grey-500 mt-0.5">Drives with finalized hiring outcomes</p>
        </div>
        <Link
          to="/cell/drives?status=COMPLETED"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-grey-100">
        {completedDrives.map((drive) => (
          <div
            key={drive.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-grey-50/50 transition-colors"
          >
            <div className="min-w-0 space-y-1">
              <span className="font-semibold text-sm text-navy-900 truncate block">
                {drive.companyName}
              </span>
              <p className="text-xs text-grey-500 truncate">{drive.role}</p>
              <p className="text-[11px] text-grey-400">
                Deadline: {formatDateTime(drive.deadline)}
              </p>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Link to={`/cell/results?driveId=${drive.id}`}>
                <Button variant="secondary" size="sm">
                  View results
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-grey-50/50 border-t border-grey-100 text-center">
        <Link
          to="/cell/drives?status=COMPLETED"
          className="text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
        >
          View all drives &rarr;
        </Link>
      </div>
    </Card>
  );
};
