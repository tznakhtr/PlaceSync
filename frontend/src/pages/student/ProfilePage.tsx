import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { getBranches, getStudentProfile } from '../../api/studentApi';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { ProfileForm } from './profile/ProfileForm';
import { ResumeCard } from './profile/ResumeCard';

/**
 * Student Profile Page (/student/profile).
 * Allows student to view and update academic details and upload their PDF resume.
 */
export const ProfilePage: React.FC = () => {
  // TanStack Query for student profile
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
  });

  // TanStack Query for branches list
  const {
    data: branchesData,
    isLoading: isBranchesLoading,
  } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
  });

  const branches = branchesData || [];
  const profile = profileData?.profile ?? null;
  const isComplete = profileData?.isComplete ?? false;

  // Initial loading state
  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Spinner size="lg" variant="emerald" />
        <p className="text-sm font-medium text-grey-500">Loading student profile...</p>
      </div>
    );
  }

  // Error state with retry button
  if (isProfileError) {
    return (
      <div className="max-w-xl mx-auto my-12">
        <Card className="p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-900 mb-2">Unable to Load Profile</h2>
          <p className="text-sm text-grey-500 mb-6">
            {getErrorMessage(profileError, 'Could not retrieve your profile. Please check connection and try again.')}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => refetchProfile()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">My Profile</h1>
          <p className="text-sm text-grey-500 mt-1">
            Manage your academic details, technical skills, and uploaded resume.
          </p>
        </div>

        {/* Profile Status Chip */}
        <div>
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Profile complete</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-bg text-warning border border-warning/20">
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
              <span>Profile incomplete</span>
            </span>
          )}
        </div>
      </div>

      {/* Friendly Banner when profile is null */}
      {profile === null && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-50 border border-navy-100 text-navy-900">
          <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Welcome to PlaceSync!</p>
            <p className="text-xs text-grey-700 mt-0.5">
              Complete your profile to see which drives you are eligible for.
            </p>
          </div>
        </div>
      )}

      {/* Two sections inside Cards */}
      <div className="space-y-6">
        {/* Academic Details Form */}
        <ProfileForm
          profile={profile}
          branches={branches}
          isBranchesLoading={isBranchesLoading}
          onSuccess={() => refetchProfile()}
        />

        {/* Resume Card */}
        <ResumeCard
          profile={profile}
          onSuccess={() => refetchProfile()}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
