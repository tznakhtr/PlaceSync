import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Edit2,
  Lock,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteDrive, updateDriveStatus } from '../../../api/driveApi';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { DriveStatusBadge } from '../../../components/ui/DriveStatusBadge';
import { useToast } from '../../../context/useToast';
import type { Drive } from '../../../types/drive';
import { formatLpa } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/getErrorMessage';

export interface CellDriveTableProps {
  drives: Drive[];
}

export const CellDriveTable: React.FC<CellDriveTableProps> = ({ drives }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [statusTargetDrive, setStatusTargetDrive] = useState<{
    drive: Drive;
    newStatus: 'OPEN' | 'CLOSED';
  } | null>(null);

  const [deleteTargetDrive, setDeleteTargetDrive] = useState<Drive | null>(null);

  const invalidateDriveQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['drives'] });
    queryClient.invalidateQueries({ queryKey: ['drive'] });
    queryClient.invalidateQueries({ queryKey: ['my-applications'] });
  };

  // Status mutation (OPEN <-> CLOSED)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'OPEN' | 'CLOSED' }) =>
      updateDriveStatus(id, status),
    onSuccess: (updated) => {
      setStatusTargetDrive(null);
      success(
        `Drive ${updated.companyName} marked as ${updated.status === 'OPEN' ? 'Open' : 'Closed'}`,
      );
      invalidateDriveQueries();
    },
    onError: (err) => {
      setStatusTargetDrive(null);
      toastError(getErrorMessage(err, 'Failed to update drive status.'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDrive(id),
    onSuccess: () => {
      setDeleteTargetDrive(null);
      success('Drive deleted successfully');
      invalidateDriveQueries();
    },
    onError: (err) => {
      setDeleteTargetDrive(null);
      toastError(getErrorMessage(err, 'Failed to delete drive.'));
    },
  });

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-grey-200 bg-surface shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-grey-50 border-b border-grey-200 text-[11px] font-semibold text-grey-500 uppercase tracking-wider">
              <th className="py-3 px-4">Company & Role</th>
              <th className="py-3 px-4">Package</th>
              <th className="py-3 px-4">Batch</th>
              <th className="py-3 px-4">Deadline</th>
              <th className="py-3 px-4 text-center">Applicants</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-200 text-xs bg-surface text-grey-700">
            {drives.map((drive) => {
              const isCompleted = drive.status === 'COMPLETED';
              const isOpen = drive.status === 'OPEN';
              const appCount = drive.applicationsCount ?? 0;
              const canDelete = appCount === 0;

              return (
                <tr key={drive.id} className="hover:bg-grey-50/50 transition-colors">
                  {/* Company & Role */}
                  <td className="py-3.5 px-4">
                    <div className="min-w-[160px]">
                      <span className="font-bold text-navy-900 block truncate" title={drive.companyName}>
                        {drive.companyName}
                      </span>
                      <span className="text-grey-500 block truncate mt-0.5" title={drive.role}>
                        {drive.role}
                      </span>
                      {drive.location && (
                        <span className="text-[11px] text-grey-400 block truncate mt-0.5">
                          {drive.location}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Package */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-700">
                    {formatLpa(drive.packageLpa)}
                  </td>

                  {/* Batch */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-navy-900">
                    {drive.graduationYear}
                  </td>

                  {/* Deadline */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <DeadlineLabel deadline={drive.deadline} />
                  </td>

                  {/* Applicants Count */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <Link
                      to={`/cell/applicants?driveId=${drive.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-navy-50 text-navy-700 hover:bg-navy-100 transition-colors"
                      title="View all student applicants"
                    >
                      <Users className="w-3.5 h-3.5 text-navy-700" />
                      <span>{appCount}</span>
                    </Link>
                  </td>

                  {/* Status Badge & Results published note */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <DriveStatusBadge status={drive.status} />
                      {isCompleted && (
                        <span className="text-[10px] font-semibold text-emerald-800">
                          Results published
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Applicants Link */}
                      <Link
                        to={`/cell/applicants?driveId=${drive.id}`}
                        className="p-1.5 rounded-lg border border-grey-200 text-grey-700 hover:text-navy-900 hover:bg-grey-50 transition-colors"
                        title="View applicants"
                      >
                        <Users className="w-4 h-4" />
                      </Link>

                      {/* Results Link */}
                      <Link
                        to={`/cell/results?driveId=${drive.id}`}
                        className="p-1.5 rounded-lg border border-grey-200 text-grey-700 hover:text-navy-900 hover:bg-grey-50 transition-colors"
                        title={isCompleted ? 'View results' : 'Publish results'}
                      >
                        <Award className="w-4 h-4 text-emerald-700" />
                      </Link>

                      {/* Edit (Hidden for COMPLETED) */}
                      {!isCompleted && (
                        <Link
                          to={`/cell/drives/${drive.id}/edit`}
                          className="p-1.5 rounded-lg border border-grey-200 text-grey-700 hover:text-navy-900 hover:bg-grey-50 transition-colors"
                          title="Edit drive"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      )}

                      {/* Close / Reopen (Hidden for COMPLETED) */}
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() =>
                            setStatusTargetDrive({
                              drive,
                              newStatus: isOpen ? 'CLOSED' : 'OPEN',
                            })
                          }
                          className="p-1.5 rounded-lg border border-grey-200 text-grey-700 hover:text-navy-900 hover:bg-grey-50 transition-colors"
                          title={isOpen ? 'Close drive' : 'Reopen drive'}
                        >
                          {isOpen ? (
                            <Lock className="w-4 h-4 text-grey-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-emerald-700" />
                          )}
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => canDelete && setDeleteTargetDrive(drive)}
                        className={`p-1.5 rounded-lg border transition-colors ${canDelete
                          ? 'border-grey-200 text-danger hover:bg-danger-bg hover:border-danger/30 cursor-pointer'
                          : 'border-grey-200 text-grey-300 opacity-50 cursor-not-allowed'
                          }`}
                        title={
                          canDelete
                            ? 'Delete drive'
                            : 'Has applications. Close it instead.'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirm Status Change (Close / Reopen) Dialog */}
      <ConfirmDialog
        isOpen={Boolean(statusTargetDrive)}
        onClose={() => setStatusTargetDrive(null)}
        onConfirm={() => {
          if (statusTargetDrive) {
            statusMutation.mutate({
              id: statusTargetDrive.drive.id,
              status: statusTargetDrive.newStatus,
            });
          }
        }}
        title={
          statusTargetDrive?.newStatus === 'CLOSED'
            ? 'Close Placement Drive'
            : 'Reopen Placement Drive'
        }
        message={
          statusTargetDrive?.newStatus === 'CLOSED'
            ? `Close applications for ${statusTargetDrive.drive.companyName}? New students will no longer be able to apply. All existing applications remain intact.`
            : `Reopen applications for ${statusTargetDrive?.drive.companyName}? Eligible students will be able to apply until the deadline.`
        }
        confirmText={
          statusTargetDrive?.newStatus === 'CLOSED' ? 'Close Drive' : 'Reopen Drive'
        }
        cancelText="Cancel"
        isLoading={statusMutation.isPending}
        variant={statusTargetDrive?.newStatus === 'CLOSED' ? 'warning' : 'primary'}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetDrive)}
        onClose={() => setDeleteTargetDrive(null)}
        onConfirm={() => {
          if (deleteTargetDrive) {
            deleteMutation.mutate(deleteTargetDrive.id);
          }
        }}
        title="Delete Placement Drive"
        message={`Are you sure you want to permanently delete the drive for ${deleteTargetDrive?.companyName} (${deleteTargetDrive?.role})? This action cannot be undone.`}
        confirmText="Delete Drive"
        cancelText="Cancel"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  );
};

