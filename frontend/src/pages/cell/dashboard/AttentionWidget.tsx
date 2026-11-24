import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { DriveStatusBadge } from '../../../components/ui/DriveStatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getDrives } from '../../../api/driveApi';
import { getDriveApplicationsSummary } from '../../../api/applicationApi';
import { getDeadlineInfo } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { Drive } from '../../../types/drive';
import type { DriveApplicationsSummary } from '../../../types/application';

/**
 * AttentionWidget:
 * Highlights up to 6 OPEN and CLOSED drives with applicants requiring coordinator action.
 * Fetches per-drive application summaries to determine whether applicants need review,
 * deadlines have passed, or decisions are ready to publish.
 */
export const AttentionWidget: React.FC = () => {
  // Query 1: Open drives (limit 50)
  const {
    data: openResponse,
    isLoading: isOpenLoading,
    isError: isOpenError,
    error: openError,
    refetch: refetchOpen,
  } = useQuery({
    queryKey: ['drives', { status: 'OPEN', limit: 50 }],
    queryFn: () => getDrives({ status: 'OPEN', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Query 2: Closed drives (limit 50)
  const {
    data: closedResponse,
    isLoading: isClosedLoading,
    isError: isClosedError,
    error: closedError,
    refetch: refetchClosed,
  } = useQuery({
    queryKey: ['drives', { status: 'CLOSED', limit: 50 }],
    queryFn: () => getDrives({ status: 'CLOSED', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const isLoadingDrives = isOpenLoading || isClosedLoading;
  const isErrorDrives = isOpenError || isClosedError;

  // Identify up to 6 candidate drives with applicationsCount > 0, soonest deadline first
  const candidates: Drive[] = useMemo(() => {
    const openDrives = openResponse?.data || [];
    const closedDrives = closedResponse?.data || [];
    return [...openDrives, ...closedDrives]
      .filter((d) => (d.applicationsCount ?? 0) > 0)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 6);
  }, [openResponse, closedResponse]);

  // Fetch summary for each candidate drive
  const summaryQueries = useQueries({
    queries: candidates.map((drive) => ({
      queryKey: ['drive-applications-summary', drive.id],
      queryFn: () => getDriveApplicationsSummary(drive.id),
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
      enabled: Boolean(drive.id),
    })),
  });

  if (isLoadingDrives) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-grey-200">
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="divide-y divide-grey-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isErrorDrives) {
    const err = openError || closedError;
    return (
      <Card padding="md" className="text-center py-6">
        <p className="text-xs text-danger mb-2 font-medium">
          {getErrorMessage(err, 'Failed to load attention drives.')}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            refetchOpen();
            refetchClosed();
          }}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="w-6 h-6 text-navy-400" />}
        title="Nothing needs your attention right now."
        description="No active drives have pending applicant reviews or unpublished decisions."
      />
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-grey-200/80">
        <h3 className="text-sm font-bold text-navy-900 tracking-tight">
          Drives that need your attention
        </h3>
        <p className="text-xs text-grey-500 mt-0.5">
          Active drives with pending candidate reviews or unfinalized hiring results
        </p>
      </div>

      {/* Candidate List */}
      <div className="divide-y divide-grey-100">
        {candidates.map((drive, idx) => {
          const summaryQuery = summaryQueries[idx];
          const summary: DriveApplicationsSummary | undefined = summaryQuery?.data;
          const isSummaryLoading = summaryQuery?.isLoading;

          return (
            <div key={drive.id} className="p-4 sm:p-5 hover:bg-grey-50/50 transition-colors space-y-3">
              {/* Drive Header Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-navy-900">{drive.companyName}</span>
                    <DriveStatusBadge status={drive.status} />
                  </div>
                  <p className="text-xs text-grey-500">{drive.role}</p>
                </div>
                <div className="shrink-0">
                  <DeadlineLabel deadline={drive.deadline} />
                </div>
              </div>

              {/* Status Breakdown Counts */}
              {isSummaryLoading ? (
                <div className="space-y-1.5 py-1">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-4 w-60" />
                </div>
              ) : summary ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="text-grey-600">
                      To review:{' '}
                      <strong className="text-navy-900 font-bold">{summary.APPLIED}</strong>
                    </span>
                    <span className="text-grey-300">•</span>
                    <span className="text-grey-600">
                      In progress:{' '}
                      <strong className="text-navy-900 font-bold">
                        {summary.SHORTLISTED + summary.INTERVIEW}
                      </strong>
                    </span>
                    <span className="text-grey-300">•</span>
                    <span className="text-grey-600">
                      Decided:{' '}
                      <strong className="text-navy-900 font-bold">
                        {summary.SELECTED + summary.REJECTED}
                      </strong>
                    </span>
                  </div>

                  {/* Priority Hint & Call to Action (First Match Wins) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-grey-100">
                    <AttentionHint drive={drive} summary={summary} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-grey-400">Unable to load applicant summary.</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

interface AttentionHintProps {
  drive: Drive;
  summary: DriveApplicationsSummary;
}

/**
 * Selects prioritized hint text and primary/secondary button according to F9 rules:
 * 1. pending is 0 and total > 0 -> "All applicants decided. Ready to publish." (Publish results)
 * 2. deadline has passed and drive is OPEN -> "Deadline passed. Close the drive or review applicants."
 * 3. APPLIED > 0 -> "{n} applicants waiting for review." (Review applicants)
 * 4. otherwise -> "{pending} applicants in progress." (Review applicants)
 */
const AttentionHint: React.FC<AttentionHintProps> = ({ drive, summary }) => {
  const pending = summary.APPLIED + summary.SHORTLISTED + summary.INTERVIEW;
  const deadlineInfo = getDeadlineInfo(drive.deadline);

  if (pending === 0 && summary.total > 0) {
    return (
      <>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>All applicants decided. Ready to publish.</span>
        </div>
        <Link to={`/cell/results?driveId=${drive.id}`} className="shrink-0 self-end sm:self-center">
          <Button variant="primary" size="sm">
            Publish results
          </Button>
        </Link>
      </>
    );
  }

  if (deadlineInfo.isPast && drive.status === 'OPEN') {
    return (
      <>
        <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Deadline passed. Close the drive or review applicants.</span>
        </div>
        <Link to={`/cell/applicants?driveId=${drive.id}`} className="shrink-0 self-end sm:self-center">
          <Button variant="secondary" size="sm">
            Review applicants
          </Button>
        </Link>
      </>
    );
  }

  if (summary.APPLIED > 0) {
    return (
      <>
        <span className="text-xs text-navy-800 font-medium">
          {summary.APPLIED} applicant{summary.APPLIED === 1 ? '' : 's'} waiting for review.
        </span>
        <Link to={`/cell/applicants?driveId=${drive.id}`} className="shrink-0 self-end sm:self-center">
          <Button variant="secondary" size="sm">
            Review applicants
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <span className="text-xs text-grey-600">
        {pending} applicant{pending === 1 ? '' : 's'} in progress.
      </span>
      <Link to={`/cell/applicants?driveId=${drive.id}`} className="shrink-0 self-end sm:self-center">
        <Button variant="secondary" size="sm">
          Review applicants
        </Button>
      </Link>
    </>
  );
};
