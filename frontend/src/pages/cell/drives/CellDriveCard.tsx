import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Building2,
  Edit2,
  GraduationCap,
  Lock,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { DriveStatusBadge } from '../../../components/ui/DriveStatusBadge';
import { useToast } from '../../../context/useToast';
import { deleteDrive, updateDriveStatus } from '../../../api/driveApi';
import { formatLpa } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { Drive } from '../../../types/drive';

export interface CellDriveCardProps {
  drive: Drive;
}

/**
 * Mobile-friendly card representation of placement drive for Placement Cell.
 */
export const CellDriveCard: React.FC<CellDriveCardProps> = ({ drive }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isCompleted = drive.status === 'COMPLETED';
  const isOpen = drive.status === 'OPEN';
  const appCount = drive.applicationsCount ?? 0;
  const canDelete = appCount === 0;

  const invalidateDriveQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['drives'] });
    queryClient.invalidateQueries({ queryKey: ['drive'] });
    queryClient.invalidateQueries({ queryKey: ['my-applications'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: 'OPEN' | 'CLOSED') => updateDriveStatus(drive.id, status),
    onSuccess: (updated) => {
      setIsStatusDialogOpen(false);
      success(
        `Drive ${updated.companyName} marked as ${updated.status === 'OPEN' ? 'Open' : 'Closed'}`,
      );
      invalidateDriveQueries();
    },
    onError: (err) => {
      setIsStatusDialogOpen(false);
      toastError(getErrorMessage(err, 'Failed to update drive status.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDrive(drive.id),
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      success('Drive deleted successfully');
      invalidateDriveQueries();
    },
    onError: (err) => {
      setIsDeleteDialogOpen(false);
      toastError(getErrorMessage(err, 'Failed to delete drive.'));
    },
  });

  return (
    <>
      <Card className="p-5 space-y-4 shadow-soft">
        {/* Header: Company, Role, StatusBadge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-navy-900 truncate">
                {drive.companyName}
              </h3>
              <p className="text-xs font-medium text-grey-600 truncate mt-0.5">
                {drive.role}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <DriveStatusBadge status={drive.status} />
            {isCompleted && (
              <span className="text-[10px] font-semibold text-emerald-800">
                Results published
              </span>
            )}
          </div>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-grey-200/80">
          <div>
            <span className="text-grey-500 block">Package</span>
            <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
              {formatLpa(drive.packageLpa)}
            </span>
          </div>

          <div>
            <span className="text-grey-500 block">Batch</span>
            <span className="font-medium text-navy-900 mt-0.5 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-grey-400" />
              <span>{drive.graduationYear} Batch</span>
            </span>
          </div>

          <div>
            <span className="text-grey-500 block">Deadline</span>
            <div className="mt-1">
              <DeadlineLabel deadline={drive.deadline} />
            </div>
          </div>

          <div>
            <span className="text-grey-500 block">Applicants</span>
            <Link
              to={`/cell/applicants?driveId=${drive.id}`}
              className="inline-flex items-center gap-1.5 font-bold text-navy-700 hover:text-navy-900 mt-1"
            >
              <Users className="w-3.5 h-3.5 text-navy-700" />
              <span>{appCount} applied</span>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/cell/applicants?driveId=${drive.id}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                Applicants
              </Button>
            </Link>

            <Link to={`/cell/results?driveId=${drive.id}`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Award className="w-3.5 h-3.5" />}
              >
                {isCompleted ? 'View results' : 'Publish results'}
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <Link to={`/cell/drives/${drive.id}/edit`}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
              </Link>
            )}

            {!isCompleted && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsStatusDialogOpen(true)}
                leftIcon={
                  isOpen ? (
                    <Lock className="w-3.5 h-3.5 text-grey-600" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  )}
              >
                {isOpen ? 'Close' : 'Reopen'}
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canDelete}
              onClick={() => canDelete && setIsDeleteDialogOpen(true)}
              className={canDelete ? 'text-danger hover:bg-danger-bg hover:border-danger/30' : ''}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              title={
                canDelete
                  ? 'Delete drive'
                  : 'Has applications. Close it instead.'
              }
            >
              Delete
            </Button>
          </div>
        </div>

        {!canDelete && (
          <p className="text-[11px] text-grey-500 italic text-right">
            Has applications. Close it instead of deleting.
          </p>
        )}
      </Card>

      {/* Confirm Status Dialog */}
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onConfirm={() => statusMutation.mutate(isOpen ? 'CLOSED' : 'OPEN')}
        title={isOpen ? 'Close Placement Drive' : 'Reopen Placement Drive'}
        message={
          isOpen
            ? `Close applications for ${drive.companyName}? New students will no longer be able to apply. All existing applications remain active.`
            : `Reopen applications for ${drive.companyName}? Eligible students will be able to apply until the deadline.`
        }
        confirmText={isOpen ? 'Close Drive' : 'Reopen Drive'}
        cancelText="Cancel"
        isLoading={statusMutation.isPending}
        variant={isOpen ? 'warning' : 'primary'}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Placement Drive"
        message={`Are you sure you want to permanently delete the drive for ${drive.companyName} (${drive.role})?`}
        confirmText="Delete Drive"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
};

