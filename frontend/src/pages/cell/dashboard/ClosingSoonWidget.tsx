import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getDrives } from '../../../api/driveApi';
import { isClosingWithinDays } from '../../../utils/dashboard';
import { getErrorMessage } from '../../../utils/getErrorMessage';

/**
 * ClosingSoonWidget:
 * Lists OPEN recruitment drives with deadlines approaching within the next 7 days, soonest first.
 */
export const ClosingSoonWidget: React.FC = () => {
  const {
    data: openResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['drives', { status: 'OPEN', limit: 50 }],
    queryFn: () => getDrives({ status: 'OPEN', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const closingSoonDrives = useMemo(() => {
    const drives = openResponse?.data || [];
    return drives
      .filter((d) => isClosingWithinDays(d.deadline, 7))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [openResponse]);

  if (isLoading) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-grey-200">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y divide-grey-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
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
          {getErrorMessage(error, 'Failed to load upcoming deadlines.')}
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

  if (closingSoonDrives.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-6 h-6 text-navy-400" />}
        title="No drives are closing in the next 7 days."
        description="Active drives with upcoming deadlines will appear here."
      />
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-grey-200/80">
        <h3 className="text-sm font-bold text-navy-900 tracking-tight">Closing soon</h3>
        <p className="text-xs text-grey-500 mt-0.5">Drives with deadlines in the next 7 days</p>
      </div>

      {/* List */}
      <div className="divide-y divide-grey-100">
        {closingSoonDrives.map((drive) => (
          <div
            key={drive.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-grey-50/50 transition-colors"
          >
            <div className="min-w-0 space-y-1">
              <span className="font-semibold text-sm text-navy-900 truncate block">
                {drive.companyName}
              </span>
              <p className="text-xs text-grey-500 truncate">{drive.role}</p>
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <DeadlineLabel deadline={drive.deadline} />
                <span className="text-xs text-grey-400">
                  {drive.applicationsCount ?? 0} applied
                </span>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Link to={`/cell/applicants?driveId=${drive.id}`}>
                <Button variant="secondary" size="sm">
                  View applicants
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
