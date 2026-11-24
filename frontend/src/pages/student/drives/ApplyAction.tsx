import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, ChevronRight, FileText, Undo2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useToast } from '../../../context/useToast';
import { applyToDrive, withdrawApplication } from '../../../api/applicationApi';
import { useMyApplications } from '../../../hooks/useMyApplications';
import { canWithdraw } from '../../../utils/applicationRules';
import { formatDateTime, getDeadlineInfo } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { Drive } from '../../../types/drive';

export interface ApplyActionProps {
  drive: Drive;
}

/**
 * ApplyAction component handling student application submissions and withdrawals.
 * Renders in place of the apply placeholder slot on the Drive Details page.
 */
export const ApplyAction: React.FC<ApplyActionProps> = ({ drive }) => {
  const { success, error: toastError, toast } = useToast();
  const queryClient = useQueryClient();

  const { getApplicationForDrive } = useMyApplications();
  const existingApplication = getApplicationForDrive(drive.id);

  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [ineligibleReasons, setIneligibleReasons] = useState<string[]>([]);

  const deadlineInfo = getDeadlineInfo(drive.deadline);
  const isDriveOpen = drive.status === 'OPEN';
  const isDeadlinePassed = deadlineInfo.isPast;
  const isEligible = drive.eligibility?.eligible ?? false;
  const hasApplied = Boolean(existingApplication);
  const allowWithdraw = canWithdraw(existingApplication);

  // Invalidate all related queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    queryClient.invalidateQueries({ queryKey: ['drives'] });
    queryClient.invalidateQueries({ queryKey: ['drive', drive.id] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  // Mutation: Apply to Drive
  const applyMutation = useMutation({
    mutationFn: () => applyToDrive(drive.id),
    onSuccess: () => {
      setIsApplyConfirmOpen(false);
      setIneligibleReasons([]);
      success(`Applied successfully to ${drive.companyName}!`);
      invalidateQueries();
    },
    onError: (err: unknown) => {
      setIsApplyConfirmOpen(false);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { message?: string; reasons?: string[] } | undefined;

        // 403 Ineligible
        if (status === 403) {
          toastError('You are not eligible for this drive');
          if (Array.isArray(data?.reasons) && data.reasons.length > 0) {
            setIneligibleReasons(data.reasons);
          }
          queryClient.invalidateQueries({ queryKey: ['drive', drive.id] });
          return;
        }

        // 409 Already applied
        if (status === 409) {
          toast('You have already applied to this drive', 'success');
          queryClient.invalidateQueries({ queryKey: ['my-applications'] });
          return;
        }
      }

      toastError(getErrorMessage(err, 'Failed to submit application. Please try again.'));
    },
  });

  // Mutation: Withdraw Application
  const withdrawMutation = useMutation({
    mutationFn: () => {
      if (!existingApplication) throw new Error('No active application found to withdraw');
      return withdrawApplication(existingApplication.id);
    },
    onSuccess: () => {
      setIsWithdrawConfirmOpen(false);
      success('Application withdrawn successfully');
      invalidateQueries();
    },
    onError: (err: unknown) => {
      setIsWithdrawConfirmOpen(false);
      toastError(getErrorMessage(err, 'Failed to withdraw application.'));
      invalidateQueries();
    },
  });

  // State D: Already Applied Card
  if (hasApplied && existingApplication) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-navy-100 bg-navy-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span className="text-sm font-bold text-navy-900">Application Submitted</span>
            </div>
            <StatusBadge status={existingApplication.status} />
          </div>

          <div className="flex items-center justify-between text-xs text-grey-500 pt-2 border-t border-navy-100/80">
            <span>Applied on: {formatDateTime(existingApplication.appliedAt)}</span>
            <Link
              to="/student/applications"
              className="font-semibold text-navy-700 hover:text-navy-900 inline-flex items-center gap-0.5 transition-colors"
            >
              <span>View my applications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Withdraw Option if permitted */}
        {allowWithdraw && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsWithdrawConfirmOpen(true)}
              isLoading={withdrawMutation.isPending}
              disabled={withdrawMutation.isPending}
              className="text-danger hover:bg-danger-bg hover:border-danger/30"
              leftIcon={<Undo2 className="w-3.5 h-3.5 text-danger" />}
            >
              Withdraw application
            </Button>
          </div>
        )}

        {/* Confirm Withdraw Dialog */}
        <ConfirmDialog
          isOpen={isWithdrawConfirmOpen}
          onClose={() => setIsWithdrawConfirmOpen(false)}
          onConfirm={() => withdrawMutation.mutate()}
          title="Withdraw Application"
          message={`Are you sure you want to withdraw your application to ${drive.companyName} for ${drive.role}? You can only re-apply if the drive is still open before the deadline.`}
          confirmText="Withdraw Application"
          cancelText="Cancel"
          isLoading={withdrawMutation.isPending}
          variant="danger"
        />
      </div>
    );
  }

  // State C: Drive not open or deadline passed
  if (!isDriveOpen || isDeadlinePassed) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="text-xs text-grey-500">
          {!isDriveOpen
            ? 'This drive is currently closed for new submissions.'
            : 'The application deadline has passed.'}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled
          className="opacity-60 cursor-not-allowed w-full sm:w-auto"
        >
          Applications closed
        </Button>
      </div>
    );
  }

  // State A: Not eligible
  if (!isEligible) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs text-grey-500">
            You must satisfy all criteria above to apply.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled
            className="opacity-60 cursor-not-allowed w-full sm:w-auto"
          >
            Not eligible
          </Button>
        </div>

        {ineligibleReasons.length > 0 && (
          <ul className="text-xs text-danger space-y-1 p-2 rounded-lg bg-danger-bg/40 border border-danger/20">
            {ineligibleReasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // State B: Eligible, not applied, drive open, future deadline -> "Apply now"
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-800 block">
            You meet all requirements!
          </span>
          <span className="text-xs text-grey-500 mt-0.5 block">
            Ready to submit your profile and resume to {drive.companyName}.
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setIsApplyConfirmOpen(true)}
          isLoading={applyMutation.isPending}
          disabled={applyMutation.isPending}
          leftIcon={<FileText className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Apply now
        </Button>
      </div>

      {/* Confirm Apply Dialog */}
      <ConfirmDialog
        isOpen={isApplyConfirmOpen}
        onClose={() => setIsApplyConfirmOpen(false)}
        onConfirm={() => applyMutation.mutate()}
        title="Confirm Application"
        message={`Apply to ${drive.companyName} for ${drive.role}? You can withdraw until the deadline while your application is still in Applied status.`}
        confirmText="Confirm & Apply"
        cancelText="Cancel"
        isLoading={applyMutation.isPending}
        variant="primary"
      />
    </>
  );
};
