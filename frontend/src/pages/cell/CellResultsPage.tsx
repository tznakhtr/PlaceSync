import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, ArrowLeft, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getDrive } from '../../api/driveApi';
import { getDriveApplicationsSummary } from '../../api/applicationApi';
import { getResults } from '../../api/resultsApi';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { DriveSelector } from './applicants/DriveSelector';
import { DriveInfoCard } from './applicants/DriveInfoCard';
import { PublishPanel } from './results/PublishPanel';
import { PublishedResults } from './results/PublishedResults';
import { PublishSuccessCard } from './results/PublishSuccessCard';
import type { PublishResponse } from '../../types/results';

/**
 * CellResultsPage:
 * Placement Cell drive outcome management portal at /cell/results?driveId=<id>.
 * Renders PublishPanel for open/closed drives, or PublishedResults for completed drives.
 */
export const CellResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract driveId from URL query string
  const driveIdParam = searchParams.get('driveId');
  const driveId = driveIdParam ? parseInt(driveIdParam, 10) : null;
  const isInvalidId = driveIdParam !== null && (isNaN(driveId!) || driveId! <= 0);

  // Temporary success response displayed immediately after a successful publish operation
  const [publishSuccessResponse, setPublishSuccessResponse] = useState<PublishResponse | null>(null);

  // 1. Fetch selected drive
  const {
    data: drive,
    isLoading: isDriveLoading,
    isError: isDriveError,
    error: driveError,
    refetch: refetchDrive,
  } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: () => getDrive(driveId!),
    enabled: driveId !== null && !isNaN(driveId) && driveId > 0,
  });

  const isCompleted = drive?.status === 'COMPLETED';

  // 2. Fetch applications summary (refetched on window focus to ensure fresh counts)
  const {
    data: summary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['drive-applications-summary', driveId],
    queryFn: () => getDriveApplicationsSummary(driveId!),
    enabled: Boolean(drive),
    refetchOnWindowFocus: true,
  });

  // 3. Fetch final selected students strictly if COMPLETED
  const {
    data: results,
    isLoading: isResultsLoading,
    isError: isResultsError,
    error: resultsError,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ['drive-results', driveId],
    queryFn: () => getResults(driveId!),
    enabled: Boolean(drive && isCompleted),
  });

  // Handle switching drive in selector
  const handleSelectDrive = (newDriveId: number | null) => {
    setPublishSuccessResponse(null);
    if (newDriveId) {
      setSearchParams({ driveId: newDriveId.toString() });
    } else {
      setSearchParams({});
    }
  };

  // State A: No drive selected
  if (!driveId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Results</h1>
            <p className="text-sm text-grey-500 mt-1">
              Finalize recruitment outcomes or inspect published hiring lists.
            </p>
          </div>
          <DriveSelector selectedDriveId={null} onSelectDrive={handleSelectDrive} />
        </div>

        <EmptyState
          icon={<Award className="w-6 h-6 text-navy-700" />}
          title="Choose a drive to publish or view its results"
          description="Select an active or completed placement drive from the dropdown to proceed."
        />
      </div>
    );
  }

  // State B: Non-numeric or invalid driveId
  if (isInvalidId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Results</h1>
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

  // State C: Drive is loading
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // State D: Drive 404 or Fetch Error
  if (isDriveError || !drive) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Results</h1>
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
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Results</h1>
        </div>

        <DriveSelector selectedDriveId={driveId} onSelectDrive={handleSelectDrive} />
      </div>

      {/* Selected Drive Overview Card */}
      <DriveInfoCard drive={drive} currentSection="results" />

      {/* Success banner if published during this session */}
      {publishSuccessResponse && (
        <PublishSuccessCard
          response={publishSuccessResponse}
          onDismiss={() => setPublishSuccessResponse(null)}
        />
      )}

      {/* Dynamic Content: PublishPanel vs PublishedResults */}
      {!isCompleted ? (
        summary && (
          <PublishPanel
            drive={drive}
            summary={summary}
            onPublishSuccess={(res) => {
              setPublishSuccessResponse(res);
              refetchDrive();
            }}
            onRefetchSummary={() => refetchSummary()}
            onRefetchDrive={() => refetchDrive()}
          />
        )
      ) : (
        <PublishedResults
          drive={drive}
          summary={summary}
          results={results}
          isLoading={isResultsLoading}
          isError={isResultsError}
          error={resultsError}
          onRetry={() => refetchResults()}
        />
      )}
    </div>
  );
};
