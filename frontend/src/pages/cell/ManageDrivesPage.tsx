import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, Briefcase, Plus, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { getDrives } from '../../api/driveApi';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { CellDriveTable } from './drives/CellDriveTable';
import { CellDriveCard } from './drives/CellDriveCard';
import type { DriveQueryParams, DriveStatus } from '../../types/drive';

/**
 * ManageDrivesPage:
 * Central portal for Placement Cell coordinators to view, filter, create, and manage campus drives.
 * Displays responsive table on desktop (md+) and cards on mobile.
 */
export const ManageDrivesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract query filters from URL search params
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const statusParam = searchParams.get('status') ?? 'ALL';
  const searchQuery = searchParams.get('search') || '';

  // Local state for debounced search input (400ms)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [prevSearch, setPrevSearch] = useState(searchQuery);

  // Sync external search query changes during render to avoid set-state-in-effect lint warnings
  if (searchQuery !== prevSearch) {
    setPrevSearch(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Debounce search update to URLSearchParams
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (localSearch.trim()) {
            next.set('search', localSearch.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchParams]);

  // Handle status filter change
  const handleStatusChange = (newStatus: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus && newStatus !== 'ALL') {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchParams({
      page: '1',
    });
  };

  // Pagination change
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || (statusParam && statusParam !== 'ALL'));

  // Build query parameters for backend GET /drives
  const queryParams: DriveQueryParams = useMemo(() => {
    const params: DriveQueryParams = {
      page,
      limit: 10,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusParam && statusParam !== 'ALL') {
      params.status = statusParam as DriveStatus;
    }

    return params;
  }, [page, searchQuery, statusParam]);

  // Query drives with keepPreviousData for smooth pagination
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

  const drives = drivesData?.data ?? [];
  const meta = drivesData?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Manage Drives</h1>
          <p className="text-sm text-grey-500 mt-1">
            Create, monitor, and manage campus placement drives, applicant lists, and hiring statuses.
          </p>
        </div>

        <Link to="/cell/drives/new">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create drive
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-grey-200 rounded-xl p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-grey-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by company or role..."
              className="w-full rounded-lg border border-grey-200 bg-surface text-grey-700 text-sm py-2 pl-9 pr-3 transition-colors placeholder:text-grey-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-48">
            <Select
              value={statusParam}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="py-2 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-xl bg-danger-bg border border-danger/20 flex items-center justify-between gap-3 text-sm text-danger">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{getErrorMessage(error, 'Failed to load placement drives.')}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && !isPlaceholderData && (
        <div className="space-y-4">
          {/* Desktop Table Skeleton */}
          <div className="hidden md:block bg-surface border border-grey-200 rounded-xl p-4 shadow-soft">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>

          {/* Mobile Card Skeleton */}
          <div className="block md:hidden space-y-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && drives.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Search className="w-6 h-6 text-navy-600" />}
            title="No drives match your filters"
            description="Try adjusting your search query or selecting a different status filter."
            action={
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Briefcase className="w-6 h-6 text-emerald-600" />}
            title="No placement drives yet"
            description="Start by creating your first campus placement drive to invite student applications."
            action={
              <Button variant="primary" onClick={() => navigate('/cell/drives/new')}>
                Create drive
              </Button>
            }
          />
        )
      ) : (
        drives.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <CellDriveTable drives={drives} />
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {drives.map((drive) => (
                <CellDriveCard key={drive.id} drive={drive} />
              ))}
            </div>

            {/* Results count & Pagination */}
            {meta && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-grey-500 order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-semibold text-navy-900">
                    {(meta.page - 1) * meta.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-navy-900">
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{' '}
                  of <span className="font-semibold text-navy-900">{meta.total}</span> drives
                </p>

                {meta.totalPages > 1 && (
                  <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center">
                    <Pagination
                      page={meta.page}
                      totalPages={meta.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
