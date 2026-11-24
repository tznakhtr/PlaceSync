import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Briefcase, FileText, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { getMyApplications } from '../../api/applicationApi';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ForbiddenState } from '../../components/common/ForbiddenState';
import { ApplicationCard } from './applications/ApplicationCard';
import type { ApplicationStatus, QueryApplicationsParams } from '../../types/application';

export const ApplicationsPage: React.FC = () => {
  usePageTitle('My Applications');
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusParam = (searchParams.get('status') || '') as ApplicationStatus | '';

  const queryParams: QueryApplicationsParams = useMemo(() => {
    const params: QueryApplicationsParams = {
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: 10,
    };
    if (statusParam) {
      params.status = statusParam;
    }
    return params;
  }, [page, statusParam]);

  // Fetch student applications with TanStack Query and keepPreviousData
  const {
    data: applicationsData,
    isLoading,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-applications', queryParams],
    queryFn: () => getMyApplications(queryParams),
    placeholderData: keepPreviousData,
  });

  const handleStatusChange = (newStatus: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus) {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const applications = applicationsData?.data || [];
  const meta = applicationsData?.meta;
  const hasFilter = Boolean(statusParam);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy-900">My Applications</h1>
          {isPlaceholderData && (
            <span className="text-xs text-grey-400 font-medium animate-pulse">Updating...</span>
          )}
        </div>
        <p className="text-sm text-grey-500 mt-1">
          Track recruitment stages, interview invitations, and published placement results.
        </p>
      </div>

      {/* Filter Row: Status Select with mandatory helper text */}
      <Card className="p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <Select
              label="Filter by Status"
              value={statusParam}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-sm py-2"
            >
              <option value="">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </Select>
            <p className="text-xs text-grey-500 mt-1.5">
              Results appear here after the placement cell publishes them.
            </p>
          </div>

          {hasFilter && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange('')}
              className="self-start sm:self-center"
            >
              Reset filter
            </Button>
          )}
        </div>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-4 gap-4 py-3 border-y border-grey-200">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        (error as { response?: { status?: number } })?.response?.status === 403 ? (
          <ForbiddenState message="You do not have access to view applications." />
        ) : (
          <Card className="p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">
              Unable to Load Applications
            </h3>
            <p className="text-sm text-grey-500 max-w-md mb-6">
              {getErrorMessage(error, 'Failed to fetch your applications. Please try again.')}
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
        )
      )}

      {/* Empty States */}
      {!isLoading && !isError && applications.length === 0 && (
        hasFilter ? (
          <EmptyState
            icon={<FileText className="w-6 h-6 text-grey-400" />}
            title="No applications with this status"
            description="You do not have any applications matching the selected status filter."
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('')}
              >
                Clear filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Briefcase className="w-6 h-6 text-emerald-500" />}
            title="You have not applied to any drive yet"
            description="Explore open campus drives to review company requirements and submit your first application."
            action={
              <Link to="/student/drives">
                <Button variant="primary" size="md">
                  Explore Campus Drives
                </Button>
              </Link>
            }
          />
        )
      )}

      {/* Applications List */}
      {!isLoading && !isError && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}

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

export default ApplicationsPage;
