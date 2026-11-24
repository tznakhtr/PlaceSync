import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ExternalLink, Send } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { publishResults } from '../../../api/resultsApi';
import { useToast } from '../../../context/useToast';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { ResultSummaryCards } from './ResultSummaryCards';
import { ReadinessChecklist } from './ReadinessChecklist';
import { PublishConfirmDialog } from './PublishConfirmDialog';
import type { Drive } from '../../../types/drive';
import type { DriveApplicationsSummary } from '../../../types/application';
import type { PublishResponse } from '../../../types/results';

export interface PublishPanelProps {
  drive: Drive;
  summary: DriveApplicationsSummary;
  onPublishSuccess: (res: PublishResponse) => void;
  onRefetchSummary: () => void;
  onRefetchDrive: () => void;
}

/**
 * PublishPanel:
 * Pre-publishing console for active placement drives.
 * Renders summary metrics, readiness checklist, auto-rejection control, and confirmation modal.
 */
export const PublishPanel: React.FC<PublishPanelProps> = ({
  drive,
  summary,
  onPublishSuccess,
  onRefetchSummary,
  onRefetchDrive,
}) => {
  const queryClient = useQueryClient();
  const { success, error: toastError, toast } = useToast();

  const [autoReject, setAutoReject] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const pendingCount = summary.APPLIED + summary.SHORTLISTED + summary.INTERVIEW;
  const isTotalZero = summary.total === 0;
  const isPendingUnresolved = pendingCount > 0 && !autoReject;
  const isPublishDisabled = isTotalZero || isPendingUnresolved;

  const publishMutation = useMutation({
    mutationFn: () => publishResults(drive.id, autoReject),
    onSuccess: (res) => {
      setIsConfirmOpen(false);
      success(`Results for ${drive.companyName} published successfully!`);

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['drive', drive.id] });
      queryClient.invalidateQueries({ queryKey: ['drives'] });
      queryClient.invalidateQueries({ queryKey: ['drive-applications', drive.id] });
      queryClient.invalidateQueries({ queryKey: ['drive-applications-summary', drive.id] });
      queryClient.invalidateQueries({ queryKey: ['drive-results', drive.id] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      onPublishSuccess(res);
    },
    onError: (err: unknown) => {
      setIsConfirmOpen(false);
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr.response?.status;
      const message = axiosErr.response?.data?.message;

      if (status === 409 && typeof message === 'string' && message.includes('pending')) {
        // Stale pending data
        setAutoReject(false);
        onRefetchSummary();
        toastError(getErrorMessage(err, 'Some applications are still pending. Please review.'));
      } else if (status === 409 && typeof message === 'string' && message.includes('already published')) {
        toast('Results have already been published by another administrator.');
        onRefetchDrive();
      } else {
        toastError(getErrorMessage(err, 'Failed to publish drive results.'));
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* 1. Result Summary Funnel Cards */}
      <ResultSummaryCards summary={summary} />

      {/* 2. Readiness Diagnostic Checklist */}
      <ReadinessChecklist drive={drive} summary={summary} />

      {/* 3. Action and Auto-Reject Section */}
      <Card className="p-5 sm:p-6 space-y-5 border-grey-200">
        <div>
          <h3 className="text-base font-bold text-navy-900 tracking-tight">
            Finalize & Publish Outcomes
          </h3>
          <p className="text-xs text-grey-500 mt-1">
            Once published, all candidates will receive official decision notices and this placement drive will be locked.
          </p>
        </div>

        {/* Auto-reject pending applicants option */}
        {pendingCount > 0 && (
          <div className="p-4 rounded-xl bg-warning-bg/30 border border-warning/30 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoReject}
                onChange={(e) => setAutoReject(e.target.checked)}
                disabled={publishMutation.isPending}
                className="w-4 h-4 mt-0.5 rounded border-grey-300 text-warning focus:ring-warning cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy-900">
                  Automatically reject the {pendingCount} pending applicant{pendingCount === 1 ? '' : 's'}
                </span>
                <p className="text-xs text-grey-600">
                  They will be marked Not selected. Prefer to decide them first?{' '}
                  <Link
                    to={`/cell/applicants?driveId=${drive.id}`}
                    className="font-semibold text-navy-800 hover:text-navy-900 underline inline-flex items-center gap-0.5"
                  >
                    Go to Applicants
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Publish Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-grey-200/60">
          <div>
            {isTotalZero ? (
              <p className="text-xs text-danger font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No applicants to publish.
              </p>
            ) : isPendingUnresolved ? (
              <p className="text-xs text-warning font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Decide the pending applicants or tick the checkbox above.
              </p>
            ) : (
              <p className="text-xs text-emerald-800 font-medium">
                Ready to publish outcomes for {summary.total} candidate{summary.total === 1 ? '' : 's'}.
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="success"
            size="md"
            disabled={isPublishDisabled || publishMutation.isPending}
            isLoading={publishMutation.isPending}
            onClick={() => setIsConfirmOpen(true)}
            leftIcon={<Send className="w-4 h-4" />}
            className="whitespace-nowrap w-full sm:w-auto"
          >
            Publish results
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <PublishConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => publishMutation.mutate()}
        companyName={drive.companyName}
        selectedCount={summary.SELECTED}
        rejectedCount={summary.REJECTED}
        pendingCount={pendingCount}
        autoReject={autoReject}
        isLoading={publishMutation.isPending}
      />
    </div>
  );
};
