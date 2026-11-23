import React, { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertCircle, Building2, Calendar, FileText, Info, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { FormError } from '../../../components/ui/FormError';
import { Input } from '../../../components/ui/Input';
import { TagInput } from '../../../components/ui/TagInput';
import { getBranches } from '../../../api/driveApi';
import { toLocalInputValue } from '../../../utils/format';
import { BranchCheckboxGroup } from './BranchCheckboxGroup';
import { EligibilityPreview } from './EligibilityPreview';
import type { Drive, DrivePayload } from '../../../types/drive';

const driveFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  role: z.string().trim().min(1, 'Role / job title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  packageLpa: z
    .number({ message: 'Package (LPA) is required and must be a number' })
    .positive('Package (LPA) must be greater than 0'),
  location: z.string().trim().optional(),
  requiredSkills: z
    .array(z.string())
    .max(30, 'Required skills cannot exceed 30 items'),
  minCgpa: z
    .number({ message: 'Minimum CGPA is required and must be a number' })
    .min(0, 'Minimum CGPA cannot be negative')
    .max(10, 'Minimum CGPA cannot exceed 10'),
  allowedBranches: z
    .array(z.string())
    .min(1, 'At least one allowed branch is required'),
  maxBacklogs: z
    .number({ message: 'Maximum active backlogs is required' })
    .int('Maximum backlogs must be a whole number')
    .min(0, 'Maximum backlogs cannot be negative'),
  graduationYear: z
    .number({ message: 'Graduation year is required' })
    .int('Graduation year must be a whole number')
    .min(2024, 'Graduation year must be at least 2024')
    .max(2035, 'Graduation year cannot exceed 2035'),
  deadline: z
    .string()
    .min(1, 'Application deadline is required')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getTime() > Date.now();
    }, 'Deadline must be in the future'),
});

type DriveFormValues = z.infer<typeof driveFormSchema>;

export interface DriveFormProps {
  initialData?: Drive | null;
  isEdit?: boolean;
  onSubmit: (payload: DrivePayload) => Promise<void>;
  isLoading?: boolean;
  serverError?: string | null;
}

export const DriveForm: React.FC<DriveFormProps> = ({
  initialData,
  isEdit = false,
  onSubmit,
  isLoading = false,
  serverError,
}) => {
  const navigate = useNavigate();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Fetch allowed branches list
  const { data: branchesData, isLoading: isBranchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });
  const branches = branchesData || [];

  // Determine initial deadline
  const rawDeadline = initialData?.deadline;
  const initialDeadline = useMemo(() => {
    if (!rawDeadline) return '';
    return toLocalInputValue(rawDeadline);
  }, [rawDeadline]);

  const defaultValues = useMemo<DriveFormValues>(
    () => ({
      companyName: initialData?.companyName || '',
      role: initialData?.role || '',
      description: initialData?.description || '',
      packageLpa:
        initialData?.packageLpa !== undefined
          ? initialData.packageLpa
          : ('' as unknown as number),
      location: initialData?.location || '',
      requiredSkills: initialData?.requiredSkills || [],
      minCgpa: initialData?.minCgpa !== undefined ? initialData.minCgpa : 0,
      allowedBranches: initialData?.allowedBranches || [],
      maxBacklogs: initialData?.maxBacklogs !== undefined ? initialData.maxBacklogs : 0,
      graduationYear:
        initialData?.graduationYear !== undefined
          ? initialData.graduationYear
          : ('' as unknown as number),
      deadline: initialDeadline,
    }),
    [initialData, initialDeadline],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<DriveFormValues>({
    resolver: zodResolver(driveFormSchema),
    defaultValues,
  });

  // Watch fields for live eligibility description and character counter
  const watchedBranches = useWatch({ control, name: 'allowedBranches' });
  const watchedBatch = useWatch({ control, name: 'graduationYear' });
  const watchedCgpa = useWatch({ control, name: 'minCgpa' });
  const watchedBacklogs = useWatch({ control, name: 'maxBacklogs' });
  const watchedDescription = useWatch({ control, name: 'description' }) || '';

  const handleFormSubmit = async (values: DriveFormValues) => {
    // Convert local datetime to UTC ISO string
    const deadlineIso = new Date(values.deadline).toISOString();

    const payload: DrivePayload = {
      companyName: values.companyName.trim(),
      role: values.role.trim(),
      description: values.description.trim(),
      packageLpa: Number(values.packageLpa),
      requiredSkills: values.requiredSkills,
      minCgpa: Number(values.minCgpa),
      allowedBranches: values.allowedBranches,
      maxBacklogs: Number(values.maxBacklogs),
      graduationYear: Number(values.graduationYear),
      deadline: deadlineIso,
    };

    if (values.location && values.location.trim().length > 0) {
      payload.location = values.location.trim();
    }

    await onSubmit(payload);
  };

  const handleCancel = () => {
    if (isDirty) {
      setIsCancelConfirmOpen(true);
    } else {
      navigate('/cell/drives');
    }
  };

  const isSaving = isLoading || isSubmitting;
  const isCompleted = initialData?.status === 'COMPLETED';
  const applicationsCount = initialData?.applicationsCount ?? 0;

  // Guard: COMPLETED drives cannot be edited
  if (isEdit && isCompleted) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-warning-bg text-warning flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-navy-900">
          Drive Cannot Be Edited
        </h2>
        <p className="text-sm text-grey-500">
          Results are published. This drive is marked as COMPLETED and can no longer be modified.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/cell/drives')}
          className="mt-2"
        >
          Back to Manage Drives
        </Button>
      </Card>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
        <FormError message={serverError} />

        {/* Existing Applications Notice in Edit Mode */}
        {isEdit && applicationsCount > 0 && (
          <div className="p-4 rounded-xl bg-navy-50 border border-navy-100 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {applicationsCount} {applicationsCount === 1 ? 'student has' : 'students have'} already applied
              </p>
              <p className="text-xs text-grey-600 mt-0.5">
                Modifying eligibility criteria updates evaluations for future applicants; existing applications will not be removed.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Company & Job Details */}
        <Card className="p-6 md:p-8 space-y-5">
          <div className="border-b border-grey-200 pb-3">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Company & Role Overview
            </h2>
            <p className="text-xs text-grey-500 mt-0.5">
              Enter the hiring organization details and role description.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Company Name"
              placeholder="e.g. Acme Technologies"
              required
              error={errors.companyName?.message}
              {...register('companyName')}
            />

            <Input
              label="Job Role / Title"
              placeholder="e.g. Graduate Software Engineer"
              required
              error={errors.role?.message}
              {...register('role')}
            />

            <Input
              label="Package (LPA in ₹)"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g. 8.5"
              required
              helperText="Annual CTC in Lakhs Per Annum (must be > 0)"
              error={errors.packageLpa?.message}
              {...register('packageLpa', { valueAsNumber: true })}
            />

            <Input
              label="Location"
              placeholder="e.g. Bengaluru, Karnataka (or Remote)"
              helperText="Optional: Work location or mode"
              error={errors.location?.message}
              {...register('location')}
            />

            {/* Description Textarea with Character Counter */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="drive-description"
                  className="block text-sm font-medium text-grey-700"
                >
                  Job Description <span className="text-danger">*</span>
                </label>
                <span className="text-xs text-grey-400 font-medium">
                  {watchedDescription.length} characters
                </span>
              </div>
              <textarea
                id="drive-description"
                rows={5}
                placeholder="Provide details about responsibilities, team, hiring process, and bond requirements..."
                className={`w-full rounded-lg border bg-surface text-grey-700 text-sm p-3 transition-colors outline-none placeholder:text-grey-400 ${errors.description
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-grey-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-danger font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Required Skills TagInput */}
            <div className="md:col-span-2">
              <Controller
                name="requiredSkills"
                control={control}
                render={({ field, fieldState }) => (
                  <TagInput
                    label="Required Skills"
                    placeholder="Type skill and press Enter or comma (e.g. React, Java, SQL)"
                    helperText="Technical proficiencies required (max 30 items, lowercase)"
                    tags={field.value || []}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    maxTags={30}
                  />
                )}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Eligibility Rules */}
        <Card className="p-6 md:p-8 space-y-6">
          <div className="border-b border-grey-200 pb-3">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Eligibility & Cutoff Criteria
            </h2>
            <p className="text-xs text-grey-500 mt-0.5">
              Set automated cutoff thresholds evaluated for student applicants.
            </p>
          </div>

          {/* Allowed Branches Checkbox Group */}
          <Controller
            name="allowedBranches"
            control={control}
            render={({ field, fieldState }) => (
              <BranchCheckboxGroup
                branches={branches}
                selectedBranches={field.value || []}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isBranchesLoading}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <Input
              label="Minimum CGPA"
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 7.50"
              required
              helperText="Cutoff CGPA (0.00 to 10.00)"
              error={errors.minCgpa?.message}
              {...register('minCgpa', { valueAsNumber: true })}
            />

            <Input
              label="Max Active Backlogs"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              required
              helperText="Maximum allowed uncleared backlogs"
              error={errors.maxBacklogs?.message}
              {...register('maxBacklogs', { valueAsNumber: true })}
            />

            <Input
              label="Graduation Year"
              type="number"
              step="1"
              min="2024"
              max="2035"
              placeholder="e.g. 2026"
              required
              helperText="Target batch (2024 to 2035)"
              error={errors.graduationYear?.message}
              {...register('graduationYear', { valueAsNumber: true })}
            />
          </div>

          {/* Application Deadline */}
          <div className="pt-2">
            <Input
              label="Application Deadline"
              type="datetime-local"
              required
              helperText="Times use your local time zone (must be in the future)"
              error={errors.deadline?.message}
              leftIcon={<Calendar className="w-4 h-4 text-grey-400" />}
              {...register('deadline')}
            />
          </div>

          {/* Live Preview Card */}
          <EligibilityPreview
            values={{
              allowedBranches: watchedBranches,
              graduationYear: watchedBatch,
              minCgpa: watchedCgpa,
              maxBacklogs: watchedBacklogs,
            }}
          />
        </Card>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            disabled={isSaving || (isEdit && !isDirty)}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEdit ? 'Save Changes' : 'Create Drive'}
          </Button>
        </div>
      </form>

      {/* Discard Changes Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => navigate('/cell/drives')}
        title="Discard Changes"
        message="Are you sure you want to discard your changes? Any unsaved edits will be lost."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="warning"
      />
    </>
  );
};

