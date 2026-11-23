import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, Briefcase, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { getDrives } from '../../api/driveApi';
import { getStudentProfile } from '../../api/studentApi';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { DriveCard } from './drives/DriveCard';
import { DriveFilters } from './drives/DriveFilters';
import type { DriveQueryParams, DriveStatus } from '../../types/drive';

export const DrivesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract query filters from URL query parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusParam = searchParams.get('status') ?? 'OPEN';
  const searchQuery = searchParams.get('search') || '';
  const eligibleOnly = searchParams.get('eligibleOnly') === 'true';

  // Cached student profile query from F2
  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
  });

  const isProfileComplete = profileData?.isComplete ?? false;

  // Build query parameters for backend GET /drives
  const queryParams: DriveQueryParams = useMemo(() => {
    const params: DriveQueryParams = {
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: 9, // Clean 3x3 grid on desktop
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusParam && statusParam !== 'ALL') {
      params.status = statusParam as DriveStatus;
    }

    if (eligibleOnly) {
      params.eligibleOnly = true;
    }

    return params;
  }, [page, searchQuery, statusParam, eligibleOnly]);

  // Query drives with TanStack Query and keepPreviousData for smooth pagination
  const {
    data: drivesData,
    isLoading,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['drives', queryParams],
    queryFn: () => getDrives(queryParams),
    placeholderData: keepPreviousData,
  });

  // Filter handlers updating URLSearchParams
  const handleSearchChange = (newSearch: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSearch.trim()) {
        next.set('search', newSearch.trim());
      } else {
        next.delete('search');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus && newStatus !== 'OPEN') {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleEligibleOnlyChange = (newEligibleOnly: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newEligibleOnly) {
        next.set('eligibleOnly', 'true');
      } else {
        next.delete('eligibleOnly');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchParams({
      page: '1',
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusParam !== 'OPEN' ||
    eligibleOnly ||
    page > 1;

  const drives = drivesData?.data || [];
  const meta = drivesData?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Campus Drives</h1>
        <p className="text-sm text-grey-500 mt-1">
          Explore upcoming company recruitment visits, packages, and eligibility requirements.
        </p>
      </div>

      {/* Incomplete Profile Banner */}
      {!isProfileComplete && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-navy-50 border border-navy-100 text-navy-900 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                Complete your profile to see which drives you are eligible for
              </p>
              <p className="text-xs text-grey-500 mt-0.5">
                Accurate academic data is required to check cutoff requirements and apply.
              </p>
            </div>
          </div>
          <Link to="/student/profile" className="shrink-0">
            <Button variant="primary" size="sm">
              Complete Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Filter Row */}
      <DriveFilters
        search={searchQuery}
        status={statusParam}
        eligibleOnly={eligibleOnly}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onEligibleOnlyChange={handleEligibleOnlyChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Initial Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="pt-3 border-t border-grey-200 flex justify-between items-center">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900 mb-1">
            Unable to Load Drives
          </h3>
          <p className="text-sm text-grey-500 max-w-md mb-6">
            {getErrorMessage(error, 'Failed to fetch placement drives. Please check your network and try again.')}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && drives.length === 0 && (
        eligibleOnly ? (
          <EmptyState
            icon={<AlertCircle className="w-6 h-6 text-warning" />}
            title="No drives match your profile right now"
            description="You currently do not meet the criteria for any open drive with this filter, or your profile is incomplete."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleEligibleOnlyChange(false)}
                >
                  Show all open drives
                </Button>
                {!isProfileComplete && (
                  <Link to="/student/profile">
                    <Button type="button" variant="secondary" size="sm">
                      Check your profile
                    </Button>
                  </Link>
                )}
              </div>
            }
          />
        ) : (
          <EmptyState
            icon={<Briefcase className="w-6 h-6 text-grey-400" />}
            title="No drives found"
            description={
              hasActiveFilters
                ? 'Try broadening your search term or changing the status filter.'
                : 'There are currently no placement drives listed in the portal.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )
      )}

      {/* Drive Cards Grid */}
      {!isLoading && !isError && drives.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {drives.map((drive) => (
              <DriveCard key={drive.id} drive={drive} />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalCount={meta.total}
              onPageChange={handlePageChange}
              isLoading={isPlaceholderData}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DrivesPage;
