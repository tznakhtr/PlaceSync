import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormError } from '../../../components/ui/FormError';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { TagInput } from '../../../components/ui/TagInput';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/useToast';
import { updateStudentProfile } from '../../../api/studentApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { ProfilePayload, StudentProfile } from '../../../types/student';

const CURRENT_YEAR = 2026;

const profileSchema = z.object({
  rollNo: z.string().trim().min(1, 'Roll number is required'),
  branch: z.string().min(1, 'Branch is required'),
  cgpa: z
    .number({ message: 'CGPA is required and must be a number' })
    .min(0, 'CGPA cannot be negative')
    .max(10, 'CGPA cannot exceed 10')
    .refine(
      (val) => Number.isFinite(val) && /^\d+(\.\d{1,2})?$/.test(val.toString()),
      'CGPA can have up to 2 decimal places',
    ),
  activeBacklogs: z
    .number({ message: 'Active backlogs is required' })
    .int('Active backlogs must be a whole number')
    .min(0, 'Active backlogs cannot be negative'),
  graduationYear: z
    .number({ message: 'Graduation year is required' })
    .int('Graduation year must be a whole number')
    .min(2024, 'Graduation year must be at least 2024')
    .max(2035, 'Graduation year cannot exceed 2035'),
  skills: z
    .array(z.string())
    .max(30, 'Skills cannot exceed 30 items'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9]{10}$/.test(val), {
      message: 'Phone must be exactly 10 digits',
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: StudentProfile | null;
  branches: string[];
  isBranchesLoading?: boolean;
  onSuccess?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  branches,
  isBranchesLoading = false,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Compute default values based on loaded profile
  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      rollNo: profile?.rollNo || '',
      branch: profile?.branch || '',
      cgpa:
        profile?.cgpa !== undefined && profile?.cgpa !== null
          ? profile.cgpa
          : ('' as unknown as number),
      activeBacklogs:
        profile?.activeBacklogs !== undefined && profile?.activeBacklogs !== null
          ? profile.activeBacklogs
          : 0,
      graduationYear: profile?.graduationYear || CURRENT_YEAR,
      skills: profile?.skills || [],
      phone: profile?.phone || '',
    }),
    [profile],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  // Re-sync form default values when profile data changes
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Mutation for updating or creating profile
  const updateMutation = useMutation({
    mutationFn: updateStudentProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setServerError(null);

    // Build payload: ensure numbers are real numbers and omit phone if empty
    const payload: ProfilePayload = {
      rollNo: values.rollNo.trim(),
      branch: values.branch,
      cgpa: Number(values.cgpa),
      activeBacklogs: Number(values.activeBacklogs),
      graduationYear: Number(values.graduationYear),
      skills: values.skills,
    };

    if (values.phone && values.phone.trim().length > 0) {
      payload.phone = values.phone.trim();
    }

    try {
      await updateMutation.mutateAsync(payload);
      success('Profile saved successfully');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setServerError(message);
      toastError(message);

      // Backend 409 indicates roll number already taken by another student
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('rollNo', {
          type: 'server',
          message,
        });
      }
    }
  };

  const isSaving = isSubmitting || updateMutation.isPending;

  return (
    <Card className="p-6 md:p-8">
      <div className="border-b border-grey-200 pb-4 mb-6">
        <h2 className="text-lg font-bold text-navy-900">Academic Details</h2>
        <p className="text-xs text-grey-500 mt-1">
          Provide your current academic record and technical skill set.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <FormError message={serverError} />

        {/* Read-only Account Info */}
        <div className="bg-grey-50 rounded-xl p-4 border border-grey-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-grey-500 mb-3">
            Account Information (Read-only)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={user?.name || ''}
              disabled
              readOnly
              helperText="Managed by your college account"
            />
            <Input
              label="College Email"
              value={user?.email || ''}
              disabled
              readOnly
              helperText="Associated login address"
            />
          </div>
        </div>

        {/* Academic Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Roll Number */}
          <Input
            label="Roll Number"
            placeholder="e.g. 21CS045"
            required
            error={errors.rollNo?.message}
            {...register('rollNo')}
          />

          {/* Branch Dropdown */}
          <Select
            label="Branch"
            required
            disabled={isBranchesLoading}
            error={errors.branch?.message}
            placeholder="Select engineering branch"
            {...register('branch')}
          >
            <option value="" disabled>
              {isBranchesLoading ? 'Loading branches...' : 'Select your branch'}
            </option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>

          {/* CGPA */}
          <Input
            label="CGPA"
            type="number"
            step="0.01"
            min="0"
            max="10"
            placeholder="e.g. 8.75"
            required
            helperText="Scale of 0.00 to 10.00 (up to 2 decimals)"
            error={errors.cgpa?.message}
            {...register('cgpa', { valueAsNumber: true })}
          />

          {/* Active Backlogs */}
          <Input
            label="Active Backlogs"
            type="number"
            step="1"
            min="0"
            placeholder="0"
            required
            helperText="Number of uncleared subjects (0 if none)"
            error={errors.activeBacklogs?.message}
            {...register('activeBacklogs', { valueAsNumber: true })}
          />

          {/* Graduation Year */}
          <Input
            label="Graduation Year"
            type="number"
            step="1"
            min="2024"
            max="2035"
            placeholder="e.g. 2026"
            required
            helperText="Valid range: 2024 to 2035"
            error={errors.graduationYear?.message}
            {...register('graduationYear', { valueAsNumber: true })}
          />

          {/* Phone (Optional) */}
          <Input
            label="Phone Number"
            type="tel"
            maxLength={10}
            placeholder="e.g. 9876543210"
            helperText="Optional: exactly 10 digits"
            error={errors.phone?.message}
            {...register('phone')}
          />

          {/* Skills (TagInput spans across 2 columns on md) */}
          <div className="md:col-span-2">
            <Controller
              name="skills"
              control={control}
              render={({ field, fieldState }) => (
                <TagInput
                  label="Technical Skills"
                  placeholder="e.g. React, TypeScript, Python..."
                  helperText="Press Enter or comma (,) to add each skill"
                  tags={field.value || []}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  maxTags={30}
                />
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-grey-200 flex items-center justify-between">
          <p className="text-xs text-grey-500">
            {isDirty ? 'You have unsaved changes' : 'All changes saved'}
          </p>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            disabled={!isDirty || isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </Card>
  );
};
