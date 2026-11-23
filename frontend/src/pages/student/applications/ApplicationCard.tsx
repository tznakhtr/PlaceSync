import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  ExternalLink,
  Info,
  MapPin,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useToast } from '../../../context/useToast';
import { withdrawApplication } from '../../../api/applicationApi';
import { canWithdraw } from '../../../utils/applicationRules';
import { formatDateTime, formatLpa } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { ApplicationProgress } from './ApplicationProgress';
import type { Application } from '../../../types/application';

export interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({ application }) => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const drive = application.drive;
  const allowWithdraw = canWithdraw(application);

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawApplication(application.id),
    onSuccess: () => {
      setIsWithdrawOpen(false);
      success(`Withdrawn application from ${drive.companyName}`);
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['drives'] });
      queryClient.invalidateQueries({ queryKey: ['drive', drive.id] });
    },
    onError: (err: unknown) => {
      setIsWithdrawOpen(false);
      toastError(getErrorMessage(err, 'Failed to withdraw application.'));
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });

  return (
    <>
      <Card className="p-5 sm:p-6 space-y-5">
        {/* Header row: Company, Role, StatusBadge */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-navy-900 leading-snug">
                {drive.companyName}
              </h3>
              <p className="text-sm font-medium text-grey-600 mt-0.5">
                {drive.role}
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <StatusBadge status={application.status} />
          </div>
        </div>

        {/* Details Row: Package, Location, Applied Date, Deadline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-grey-200/80 text-xs">
          <div>
            <span className="text-grey-500 block">Package</span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
              {formatLpa(drive.packageLpa)}
            </span>
          </div>

          <div>
            <span className="text-grey-500 block">Location</span>
            <span className="font-semibold text-navy-900 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-grey-400 shrink-0" />
              <span className="truncate">{drive.location || 'Not specified'}</span>
            </span>
          </div>

          <div>
            <span className="text-grey-500 block">Applied Date</span>
            <span className="font-medium text-navy-900 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-grey-400 shrink-0" />
              <span>{formatDateTime(application.appliedAt)}</span>
            </span>
          </div>

          <div>
            <span className="text-grey-500 block">Drive Deadline</span>
            <span className="font-medium text-grey-700 mt-0.5 flex items-center gap-1">
              <span>{formatDateTime(drive.deadline)}</span>
            </span>
          </div>
        </div>

        {/* Recruitment Stage Stepper */}
        <div className="pt-1">
          <ApplicationProgress status={application.status} />
        </div>

        {/* Selected Message */}
        {application.status === 'SELECTED' && (
          <div className="p-3.5 rounded-lg bg-emerald-100/60 border border-emerald-500/30 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Congratulations! You have been selected.</span>
          </div>
        )}

        {/* Rejected Message */}
        {application.status === 'REJECTED' && (
          <div className="p-3.5 rounded-lg bg-grey-50 border border-grey-200 text-grey-700 text-xs font-medium flex items-center gap-2.5">
            <Info className="w-4 h-4 text-grey-500 shrink-0" />
            <span>Results are out. You were not selected this time.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <Link to={`/student/drives/${drive.id}`}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5 text-grey-400" />}
            >
              View drive
            </Button>
          </Link>

          {allowWithdraw && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsWithdrawOpen(true)}
              isLoading={withdrawMutation.isPending}
              disabled={withdrawMutation.isPending}
              className="text-danger hover:bg-danger-bg hover:border-danger/30"
              leftIcon={<Undo2 className="w-3.5 h-3.5 text-danger" />}
            >
              Withdraw
            </Button>
          )}
        </div>
      </Card>

      {/* Confirm Withdraw Dialog */}
      <ConfirmDialog
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={() => withdrawMutation.mutate()}
        title="Withdraw Application"
        message={`Are you sure you want to withdraw your application to ${drive.companyName} for ${drive.role}? You can only re-apply if the drive is still open before the deadline.`}
        confirmText="Withdraw Application"
        cancelText="Cancel"
        isLoading={withdrawMutation.isPending}
        variant="danger"
      />
    </>
  );
};
