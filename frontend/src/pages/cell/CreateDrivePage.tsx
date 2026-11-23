import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { createDrive } from '../../api/driveApi';
import { useToast } from '../../context/useToast';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { DriveForm } from './drives/DriveForm';
import type { DrivePayload } from '../../types/drive';

/**
 * CreateDrivePage:
 * Form page for Placement Cell coordinators to publish a new placement drive.
 */
export const CreateDrivePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: DrivePayload) => createDrive(payload),
    onSuccess: (newDrive) => {
      queryClient.invalidateQueries({ queryKey: ['drives'] });
      queryClient.invalidateQueries({ queryKey: ['drive'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      success(`Placement drive for ${newDrive.companyName} created successfully.`);
      navigate('/cell/drives');
    },
    onError: (err) => {
      const msg = getErrorMessage(err, 'Failed to create placement drive.');
      setServerError(msg);
      toastError(msg);
    },
  });

  const handleCreateSubmit = async (payload: DrivePayload) => {
    setServerError(null);
    await createMutation.mutateAsync(payload);
  };

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
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Create Placement Drive</h1>
        <p className="text-sm text-grey-500 mt-1">
          Define role responsibilities, eligibility criteria, CTC details, and application deadlines.
        </p>
      </div>

      {/* Main Drive Form */}
      <DriveForm
        isEdit={false}
        onSubmit={handleCreateSubmit}
        isLoading={createMutation.isPending}
        serverError={serverError}
      />
    </div>
  );
};
