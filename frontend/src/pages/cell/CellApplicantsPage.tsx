import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Skeleton } from '../../components/ui/Skeleton';
import { getBranches, getDrive } from '../../api/driveApi';
import {
  bulkUpdateApplicationsStatus,
  getDriveApplications,
  getDriveApplicationsSummary,
  updateApplicationStatus,
} from '../../api/applicationApi';
import { useToast } from '../../context/useToast';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { getStatusActionLabel } from '../../utils/applicationRules';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ForbiddenState } from '../../components/common/ForbiddenState';
import { DriveSelector } from './applicants/DriveSelector';
import { DriveInfoCard } from './applicants/DriveInfoCard';
import { ApplicationsSummaryFunnel } from './applicants/ApplicationsSummaryFunnel';
import { ApplicantFilters } from './applicants/ApplicantFilters';
import { BulkActionBar } from './applicants/BulkActionBar';
import { ApplicantTable } from './applicants/ApplicantTable';
import { ApplicantCard } from './applicants/ApplicantCard';
import type {
  ApplicationStatus,
  DriveApplicant,
  QueryDriveApplicantsParams,
} from '../../types/application';

/**
 * CellApplicantsPage:
 * Placement Cell candidate review and progression portal.
 * Accessible at /cell/applicants?driveId=<id>.
 */
export const CellApplicantsPage: React.FC = () => {
  usePageTitle('Review Applicants');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // Extract driveId from query string
  const driveIdParam = searchParams.get('driveId');
  const driveId = driveIdParam ? parseInt(driveIdParam, 10) : null;
  const isInvalidId = driveIdParam !== null && (isNaN(driveId!) || driveId! <= 0);

  // Extract filter parameters
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const status = (searchParams.get('status') as ApplicationStatus | 'ALL') || 'ALL';
  const branch = searchParams.get('branch') || '';
  const minCgpa = searchParams.get('minCgpa') || '';
  const search = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sortBy') as 'appliedAt' | 'cgpa') || 'appliedAt';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Confirm dialog state for bulk status change
  const [bulkTargetStatus, setBulkTargetStatus] = useState<ApplicationStatus | null>(null);

  // Confirm dialog state for single status change
  const [singleTarget, setSingleTarget] = useState<{
    applicant: DriveApplicant;
    nextStatus: ApplicationStatus;
  } | null>(null);

  // Fetch drive details
  const {
    data: drive,
    isLoading: isDriveLoading,
    isError: isDriveError,
    error: driveError,
  } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: () => getDrive(driveId!),
    enabled: driveId !== null && !isNaN(driveId) && driveId > 0,
  });

  // Fetch applications summary metrics
  const { data: summary } = useQuery({
    queryKey: ['drive-applications-summary', driveId],
    queryFn: () => getDriveApplicationsSummary(driveId!),
    enabled: Boolean(drive),
  });

  // Fetch allowed branch names
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });
  const branches = branchesData || [];

  // Build query parameters for applicants list
  const queryParams: QueryDriveApplicantsParams = useMemo(() => {
    const params: QueryDriveApplicantsParams = {
      page,
      limit: 20,
      sortBy,
      order,
    };

    if (status && status !== 'ALL') {
      params.status = status;
    }
    if (branch) {
      params.branch = branch;
    }
    if (minCgpa && !isNaN(parseFloat(minCgpa))) {
      params.minCgpa = parseFloat(minCgpa);
    }
    if (search.trim()) {
      params.search = search.trim();
    }

    return params;
  }, [page, status, branch, minCgpa, search, sortBy, order]);

  // Fetch paginated applicants
  const {
    data: applicantsData,
    isLoading: isApplicantsLoading,
    isPlaceholderData,
    isError: isApplicantsError,
    error: applicantsError,
    refetch: refetchApplicants,
  } = useQuery({
    queryKey: ['drive-applications', driveId, queryParams],
    queryFn: () => getDriveApplications(driveId!, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(drive),
  });

  const applicants = applicantsData?.data || [];
  const meta = applicantsData?.meta;

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['drive-applications', driveId] });
    queryClient.invalidateQueries({ queryKey: ['drive-applications-summary', driveId] });
    queryClient.invalidateQueries({ queryKey: ['drive', driveId] });
    queryClient.invalidateQueries({ queryKey: ['drives'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  // Single status mutation
  const singleStatusMutation = useMutation({
    mutationFn: ({
      applicationId,
      newStatus,
    }: {
      applicationId: number;
      newStatus: ApplicationStatus;
    }) => updateApplicationStatus(applicationId, newStatus),
    onSuccess: (updated) => {
      setSingleTarget(null);
      success(
        `${updated.student.name} marked as ${getStatusActionLabel(updated.status)}`,
      );
      invalidateQueries();
    },
    onError: (err) => {
      setSingleTarget(null);
      toastError(getErrorMessage(err, 'Failed to update candidate status.'));
    },
  });

  // Bulk status mutation
  const bulkStatusMutation = useMutation({
    mutationFn: ({
      targetStatus,
      ids,
    }: {
      targetStatus: ApplicationStatus;
      ids: number[];
    }) => bulkUpdateApplicationsStatus(driveId!, { applicationIds: ids, status: targetStatus }),
    onSuccess: (res) => {
      setBulkTargetStatus(null);
      setSelectedIds(new Set());
      success(`Updated status for ${res.updated} candidate(s) successfully.`);
      invalidateQueries();
    },
    onError: (err) => {
      setBulkTargetStatus(null);
      toastError(getErrorMessage(err, 'Failed to update candidate statuses in bulk.'));
    },
  });

  // Handle switching drive in selector
  const handleSelectDrive = (newDriveId: number | null) => {
    setSelectedIds(new Set());
    if (newDriveId) {
      setSearchParams({ driveId: newDriveId.toString() });
    } else {
      setSearchParams({});
    }
  };

  // Filter update handlers
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
      if (newStatus && newStatus !== 'ALL') {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleBranchChange = (newBranch: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newBranch) {
        next.set('branch', newBranch);
      } else {
        next.delete('branch');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleMinCgpaChange = (newMinCgpa: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newMinCgpa.trim()) {
        next.set('minCgpa', newMinCgpa.trim());
      } else {
        next.delete('minCgpa');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleSortChange = (newSortBy: 'appliedAt' | 'cgpa', newOrder: 'asc' | 'desc') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('sortBy', newSortBy);
      next.set('order', newOrder);
      next.set('page', '1');
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const currentDriveId = prev.get('driveId');
      if (currentDriveId) {
        next.set('driveId', currentDriveId);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allOnPage = applicants.map((app) => app.id);
    const areAllSelected = allOnPage.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (areAllSelected) {
        allOnPage.forEach((id) => next.delete(id));
      } else {
        allOnPage.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const hasActiveFilters = Boolean(
    (status && status !== 'ALL') ||
      branch ||
      minCgpa ||
      search.trim() ||
      sortBy !== 'appliedAt' ||
      order !== 'desc',
  );

  const isCompletedDrive = drive?.status === 'COMPLETED';

  // No drive selected state
  if (!driveId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Applicants</h1>
            <p className="text-sm text-grey-500 mt-1">
              Select a campus placement drive to review submissions and manage the recruitment funnel.
            </p>
          </div>
          <DriveSelector selectedDriveId={null} onSelectDrive={handleSelectDrive} />
        </div>

        <EmptyState
          icon={<Briefcase className="w-6 h-6 text-navy-700" />}
          title="Choose a drive to see its applicants"
          description="Use the dropdown above to select a placement drive and inspect candidate applications."
        />
      </div>
    );
  }

  // Invalid ID state
  if (isInvalidId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Applicants</h1>
          </div>
          <DriveSelector selectedDriveId={null} onSelectDrive={handleSelectDrive} />
        </div>

        <div className="max-w-xl mx-auto py-8">
          <Card className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Invalid Drive Identifier</h2>
            <p className="text-sm text-grey-500">
              The drive ID specified in the URL is not a valid number.
            </p>
            <Button variant="primary" onClick={() => navigate('/cell/drives')}>
              Back to Manage Drives
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Loading Drive state
  if (isDriveLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-44 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-72" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Drive 404 or Fetch Error
  if (isDriveError || !drive) {
    if ((driveError as { response?: { status?: number } })?.response?.status === 403) {
      return (
        <div className="space-y-6">
          <ForbiddenState message="You do not have access to view applicants for this drive." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Applicants</h1>
          </div>
          <DriveSelector selectedDriveId={driveId} onSelectDrive={handleSelectDrive} />
        </div>

        <div className="max-w-xl mx-auto py-8">
          <Card className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Placement Drive Not Found</h2>
            <p className="text-sm text-grey-500">
              {getErrorMessage(
                driveError,
                'The requested drive could not be found or may have been deleted.',
              )}
            </p>
            <Button variant="primary" onClick={() => navigate('/cell/drives')}>
              Back to Manage Drives
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/cell/drives"
              className="text-xs font-medium text-grey-500 hover:text-navy-900 transition-colors inline-flex items-center gap-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Drives</span>
            </Link>
            <span className="text-grey-300">/</span>
            <span className="text-xs font-semibold text-navy-800">{drive.companyName}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Applicants</h1>
            {isPlaceholderData && (
              <span className="text-xs text-grey-400 font-medium animate-pulse">Updating...</span>
            )}
          </div>
        </div>

        <DriveSelector selectedDriveId={driveId} onSelectDrive={handleSelectDrive} />
      </div>

      {/* Selected Drive Overview Card */}
      <DriveInfoCard drive={drive} currentSection="applicants" />

      {/* Recruitment Funnel Summary Cards */}
      {summary && (
        <ApplicationsSummaryFunnel
          summary={summary}
          activeStatus={status}
          onStatusClick={(clickedStatus) => {
            handleStatusChange(clickedStatus === status ? 'ALL' : clickedStatus);
          }}
        />
      )}

      {/* Bulk Action Bar (Visible when candidates are selected) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onTriggerBulkStatus={(target) => setBulkTargetStatus(target)}
        isCompletedDrive={isCompletedDrive}
        isLoading={bulkStatusMutation.isPending}
      />

      {/* Filters Bar */}
      <ApplicantFilters
        search={search}
        status={status}
        branch={branch}
        minCgpa={minCgpa}
        sortBy={sortBy}
        order={order}
        branches={branches}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onBranchChange={handleBranchChange}
        onMinCgpaChange={handleMinCgpaChange}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Applicants List Error */}
      {isApplicantsError && (
        <div className="p-4 rounded-xl bg-danger-bg border border-danger/20 flex items-center justify-between gap-3 text-sm text-danger">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{getErrorMessage(applicantsError, 'Failed to load applicant records.')}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refetchApplicants()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isApplicantsLoading && !isPlaceholderData && (
        <div className="bg-surface border border-grey-200 rounded-xl p-4 shadow-soft space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {/* Applicants View */}
      {!isApplicantsLoading && applicants.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-navy-700" />}
            title="No applicants match your filters"
            description="Try relaxing your search query, branch selection, or minimum CGPA filter."
            action={
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users className="w-6 h-6 text-emerald-600" />}
            title="No applicants yet"
            description="Students have not applied to this placement drive yet."
          />
        )
      ) : (
        applicants.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <ApplicantTable
                applicants={applicants}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onSingleStatusChange={(applicant, nextStatus) => {
                  setSingleTarget({ applicant, nextStatus });
                }}
                isCompletedDrive={isCompletedDrive}
                isUpdatingId={
                  singleStatusMutation.isPending && singleTarget
                    ? singleTarget.applicant.id
                    : null
                }
              />
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-3">
              {applicants.map((app) => (
                <ApplicantCard
                  key={app.id}
                  applicant={app}
                  isSelected={selectedIds.has(app.id)}
                  onToggleSelect={handleToggleSelect}
                  onSingleStatusChange={(applicant, nextStatus) => {
                    setSingleTarget({ applicant, nextStatus });
                  }}
                  isCompletedDrive={isCompletedDrive}
                  isUpdating={
                    singleStatusMutation.isPending && singleTarget?.applicant.id === app.id
                  }
                />
              ))}
            </div>

            {/* Pagination & Count */}
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
                  of <span className="font-semibold text-navy-900">{meta.total}</span> applicants
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

      {/* Single Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={singleTarget !== null}
        onClose={() => setSingleTarget(null)}
        onConfirm={() => {
          if (singleTarget) {
            singleStatusMutation.mutate({
              applicationId: singleTarget.applicant.id,
              newStatus: singleTarget.nextStatus,
            });
          }
        }}
        title={`Confirm ${singleTarget ? getStatusActionLabel(singleTarget.nextStatus) : 'Action'}`}
        message={
          singleTarget ? (
            <p>
              Are you sure you want to mark{' '}
              <strong className="text-navy-900">{singleTarget.applicant.student.name}</strong> as{' '}
              <strong className="text-navy-900">
                {getStatusActionLabel(singleTarget.nextStatus)}
              </strong>
              ?
            </p>
          ) : (
            ''
          )
        }
        confirmText={singleTarget ? getStatusActionLabel(singleTarget.nextStatus) : 'Confirm'}
        variant={singleTarget?.nextStatus === 'REJECTED' ? 'danger' : 'primary'}
        isLoading={singleStatusMutation.isPending}
      />

      {/* Bulk Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkTargetStatus !== null}
        onClose={() => setBulkTargetStatus(null)}
        onConfirm={() => {
          if (bulkTargetStatus && selectedIds.size > 0) {
            bulkStatusMutation.mutate({
              targetStatus: bulkTargetStatus,
              ids: Array.from(selectedIds),
            });
          }
        }}
        title={`Bulk ${bulkTargetStatus ? getStatusActionLabel(bulkTargetStatus) : 'Action'}`}
        message={
          bulkTargetStatus ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to advance{' '}
                <strong className="text-navy-900">{selectedIds.size} candidate(s)</strong> to{' '}
                <strong className="text-navy-900">
                  {getStatusActionLabel(bulkTargetStatus)}
                </strong>
                ?
              </p>
              <p className="text-xs text-grey-500">
                This operation is processed in an all-or-nothing transaction. If any candidate
                cannot make this transition, no records will be changed.
              </p>
            </div>
          ) : (
            ''
          )
        }
        confirmText={`Proceed with ${bulkTargetStatus ? getStatusActionLabel(bulkTargetStatus) : 'Update'}`}
        variant={bulkTargetStatus === 'REJECTED' ? 'danger' : 'primary'}
        isLoading={bulkStatusMutation.isPending}
      />
    </div>
  );
};
