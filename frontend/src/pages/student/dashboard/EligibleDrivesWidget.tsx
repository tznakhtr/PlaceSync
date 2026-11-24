import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, ChevronRight, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getDrives } from '../../../api/driveApi';
import { getMyApplications } from '../../../api/applicationApi';
import { getStudentProfile } from '../../../api/studentApi';
import { formatLpa } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';

/**
 * EligibleDrivesWidget:
 * Displays up to 5 open drives the student is eligible for that have not yet been applied to.
 */
export const EligibleDrivesWidget: React.FC = () => {
  // Query 1: Student profile to check completeness
  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Query 2: Open eligible drives
  const {
    data: drivesResponse,
    isLoading: isDrivesLoading,
    isError: isDrivesError,
    error: drivesError,
    refetch: refetchDrives,
  } = useQuery({
    queryKey: ['drives', { status: 'OPEN', eligibleOnly: true, limit: 20, page: 1 }],
    queryFn: () => getDrives({ status: 'OPEN', eligibleOnly: true, limit: 20, page: 1 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Query 3: Student's existing applications
  const { data: applicationsResponse, isLoading: isAppsLoading } = useQuery({
    queryKey: ['my-applications', { limit: 50 }],
    queryFn: () => getMyApplications({ limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const isLoading = isProfileLoading || isDrivesLoading || isAppsLoading;

  if (isLoading) {
    return (
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-grey-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isDrivesError) {
    return (
      <Card padding="md" className="text-center py-6">
        <p className="text-xs text-danger mb-2 font-medium">
          {getErrorMessage(drivesError, 'Failed to load eligible drives.')}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetchDrives()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      </Card>
    );
  }

  const isProfileComplete = profileResponse?.isComplete ?? false;

  // Incomplete profile rule: never claim no drives exist; direct to profile
  if (!isProfileComplete) {
    return (
      <EmptyState
        icon={<UserCheck className="w-6 h-6 text-navy-700" />}
        title="Complete your profile"
        description="Complete your profile to see drives you are eligible for."
        action={
          <Link to="/student/profile">
            <Button variant="primary" size="sm">
              Complete profile
            </Button>
          </Link>
        }
      />
    );
  }

  const eligibleDrives = drivesResponse?.data || [];
  const appliedDriveIds = new Set(
    (applicationsResponse?.data || []).map((app) => app.drive.id),
  );
  const unappliedDrives = eligibleDrives.filter((drive) => !appliedDriveIds.has(drive.id));

  // No matching open drives right now
  if (eligibleDrives.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="w-6 h-6 text-navy-400" />}
        title="No open drives matching"
        description="No open drives match your profile right now. We will notify you when one appears."
      />
    );
  }

  // Applied to all eligible drives
  if (unappliedDrives.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="w-6 h-6 text-emerald-600" />}
        title="All caught up"
        description="You have applied to every drive you are eligible for."
        action={
          <Link to="/student/applications">
            <Button variant="secondary" size="sm">
              View your applications
            </Button>
          </Link>
        }
      />
    );
  }

  const displayDrives = unappliedDrives.slice(0, 5);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-grey-200/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy-900 tracking-tight">
            Open drives you can apply to
          </h3>
          <p className="text-xs text-grey-500 mt-0.5">
            Matching your branch, CGPA, and backlog criteria
          </p>
        </div>
        <Link
          to="/student/drives?status=OPEN&eligibleOnly=true"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-grey-100">
        {displayDrives.map((drive) => (
          <div
            key={drive.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-grey-50/50 transition-colors"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-navy-900 truncate">
                  {drive.companyName}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {formatLpa(drive.packageLpa)}
                </span>
              </div>
              <p className="text-xs text-grey-500 truncate">{drive.role}</p>
              <div className="pt-0.5">
                <DeadlineLabel deadline={drive.deadline} />
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Link to={`/student/drives/${drive.id}`}>
                <Button variant="secondary" size="sm">
                  View
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-grey-50/50 border-t border-grey-100 text-center">
        <Link
          to="/student/drives?status=OPEN&eligibleOnly=true"
          className="text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
        >
          View all drives &rarr;
        </Link>
      </div>
    </Card>
  );
};
