import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { getMyApplications } from '../../../api/applicationApi';
import { countByStatus } from '../../../utils/dashboard';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { ApplicationStatus } from '../../../types/application';

interface StatusItemConfig {
  status: ApplicationStatus;
  label: string;
  hasLink: boolean;
}

const statusItems: StatusItemConfig[] = [
  { status: 'APPLIED', label: 'Applied', hasLink: true },
  { status: 'SHORTLISTED', label: 'Shortlisted', hasLink: true },
  { status: 'INTERVIEW', label: 'Interview', hasLink: true },
  { status: 'UNDER_REVIEW', label: 'Under Review', hasLink: false },
  { status: 'SELECTED', label: 'Selected', hasLink: true },
  { status: 'REJECTED', label: 'Not Selected', hasLink: true },
];

/**
 * ApplicationStatusWidget:
 * Displays distribution count cards for recruitment stages.
 * Links to filtered applications page (except Under Review).
 */
export const ApplicationStatusWidget: React.FC = () => {
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
      <Card padding="md" className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card padding="md" className="text-center py-6">
        <p className="text-xs text-danger mb-2 font-medium">
          {getErrorMessage(error, 'Failed to load application status counts.')}
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
  const counts = countByStatus(applications);

  return (
    <Card padding="md" className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-navy-900">My application status</h3>
        <p className="text-xs text-grey-500 mt-0.5">Summary across all applied placement drives</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {statusItems.map((item) => {
          const count = counts[item.status] ?? 0;
          const cardContent = (
            <div
              className={`p-3 rounded-xl border border-grey-200 bg-surface flex flex-col items-start gap-1.5 transition-all ${
                item.hasLink ? 'hover:border-grey-300 hover:shadow-xs cursor-pointer' : ''
              }`}
            >
              <StatusBadge status={item.status} />
              <span className="text-xl font-bold text-navy-900">{count}</span>
            </div>
          );

          if (item.hasLink) {
            return (
              <Link
                key={item.status}
                to={`/student/applications?status=${item.status}`}
                className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
              >
                {cardContent}
              </Link>
            );
          }

          return <div key={item.status}>{cardContent}</div>;
        })}
      </div>

      <p className="text-[11px] text-grey-400 leading-snug">
        Under review means a decision has been made but the results are not published yet.
      </p>
    </Card>
  );
};
