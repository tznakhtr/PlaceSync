import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, RefreshCw, UserCheck, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getStudentProfile } from '../../../api/studentApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import { getProfileCompleteness } from '../../../utils/profileCompleteness';

/**
 * ProfileCompletenessCard:
 * Visual progress breakdown for 8 weighted profile fields.
 * Distinguishes fields required for drive eligibility vs recommended additions.
 */
export const ProfileCompletenessCard: React.FC = () => {
  const {
    data: profileResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card padding="md" className="text-center py-6">
        <p className="text-xs text-danger mb-2 font-medium">
          {getErrorMessage(error, 'Failed to load profile status.')}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      </Card>
    );
  }

  const profile = profileResponse?.profile;
  const isCompleteBackend = profileResponse?.isComplete ?? false;
  const { percent, items } = getProfileCompleteness(profile);

  return (
    <Card padding="md" className="space-y-5">
      {/* Header with backend isComplete chip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy-900">Profile Completeness</h3>
            <p className="text-[11px] text-grey-500">Eligibility & recommendation check</p>
          </div>
        </div>

        {isCompleteBackend ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Eligible for drives
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning border border-warning/20">
            Profile incomplete
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar value={percent} label="Completion Score" />

      {/* 8-Item Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-grey-100">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-grey-50/70"
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Done" />
              ) : (
                <XCircle className="w-4 h-4 text-grey-400 shrink-0" aria-label="Missing" />
              )}
              <span className={`truncate ${item.done ? 'text-navy-900 font-medium' : 'text-grey-600'}`}>
                {item.label}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {item.requiredForEligibility && !item.done && (
                <span className="text-[10px] text-navy-700 bg-navy-100 px-1.5 py-0.5 rounded font-medium">
                  Needed
                </span>
              )}
              <span className={`text-[11px] font-semibold ${item.done ? 'text-emerald-700' : 'text-grey-400'}`}>
                {item.done ? 'Done' : 'Missing'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Banner / Button */}
      {percent === 100 && isCompleteBackend ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your profile is complete and eligible for placement drives!</span>
        </div>
      ) : (
        <Link to="/student/profile" className="block">
          <Button variant="primary" size="sm" fullWidth>
            Complete your profile
          </Button>
        </Link>
      )}
    </Card>
  );
};
