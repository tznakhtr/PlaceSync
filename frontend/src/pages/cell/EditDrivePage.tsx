import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { getDrive, updateDrive } from '../../api/driveApi';
import { useToast } from '../../context/useToast';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ForbiddenState } from '../../components/common/ForbiddenState';
import { DriveForm } from './drives/DriveForm';
import type { DrivePayload } from '../../types/drive';

/**
 * EditDrivePage:
 * Form page for Placement Cell coordinators to update an existing placement drive.
 */
export const EditDrivePage: React.FC = () => {
  usePageTitle('Edit Placement Drive');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const driveId = parseInt(id || '', 10);
  const isValidId = !isNaN(driveId) && driveId > 0;

  // Fetch target drive data
  const {
    data: drive,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: () => getDrive(driveId),
    enabled: isValidId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: DrivePayload) => updateDrive(driveId, payload),
    onSuccess: (updatedDrive) => {
      queryClient.invalidateQueries({ queryKey: ['drives'] });
      queryClient.invalidateQueries({ queryKey: ['drive', driveId] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      success(`Placement drive for ${updatedDrive.companyName} updated successfully.`);
      navigate('/cell/drives');
    },
    onError: (err) => {
      const msg = getErrorMessage(err, 'Failed to update placement drive.');
      setServerError(msg);
      toastError(msg);
    },
  });

  const handleUpdateSubmit = async (payload: DrivePayload) => {
    setServerError(null);
    await updateMutation.mutateAsync(payload);
  };

  // Guard: invalid ID in URL
  if (!isValidId) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Invalid Drive Identifier</h2>
          <p className="text-sm text-grey-500">
            The placement drive ID specified in the link is not a valid number.
          </p>
          <Button variant="primary" onClick={() => navigate('/cell/drives')}>
            Back to Manage Drives
          </Button>
        </Card>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Skeleton className="h-5 w-36 mb-3" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  // Error / Not found state
  if (isError || !drive) {
    if ((error as { response?: { status?: number } })?.response?.status === 403) {
      return (
        <div className="max-w-xl mx-auto py-12">
          <ForbiddenState message="You do not have permission to edit this placement drive." />
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Placement Drive Not Found</h2>
          <p className="text-sm text-grey-500">
            {getErrorMessage(error, 'The requested placement drive does not exist or has been removed.')}
          </p>
          <Button variant="primary" onClick={() => navigate('/cell/drives')}>
            Back to Manage Drives
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/cell/drives"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-grey-500 hover:text-navy-900 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Manage Drives</span>
        </Link>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Edit Placement Drive</h1>
        <p className="text-sm text-grey-500 mt-1">
          Update requirements and details for <span className="font-medium text-navy-800">{drive.companyName}</span> ({drive.role}).
        </p>
      </div>

      {/* Main Drive Form */}
      <DriveForm
        isEdit={true}
        initialData={drive}
        onSubmit={handleUpdateSubmit}
        isLoading={updateMutation.isPending}
        serverError={serverError}
      />
    </div>
  );
};
