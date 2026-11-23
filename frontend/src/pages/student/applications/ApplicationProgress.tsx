import React from 'react';
import { AlertCircle, Check, CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ApplicationStatus } from '../../../types/application';

export interface ApplicationProgressProps {
  status: ApplicationStatus;
  className?: string;
}

/**
 * Compact stepper showing the 4 recruitment phases:
 * 1. Applied
 * 2. Shortlisted
 * 3. Interview
 * 4. Result (Pending, Under review, Selected, Not selected)
 * Always shows text labels for every step, never color alone.
 */
export const ApplicationProgress: React.FC<ApplicationProgressProps> = ({
  status,
  className = '',
}) => {
  // Determine step completion levels
  const isAppliedDone = status !== 'APPLIED';
  const isShortlistedDone = ['INTERVIEW', 'UNDER_REVIEW', 'SELECTED'].includes(status);
  const isInterviewDone = ['UNDER_REVIEW', 'SELECTED'].includes(status);

  // Status flags
  const isUnderReview = status === 'UNDER_REVIEW';
  const isSelected = status === 'SELECTED';
  const isRejected = status === 'REJECTED';

  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="grid grid-cols-4 gap-2 relative">
        {/* Connecting horizontal line */}
        <div
          className="absolute top-3.5 left-[12.5%] right-[12.5%] h-0.5 bg-grey-200 -z-0"
          aria-hidden="true"
        />

        {/* Step 1: Applied */}
        <div className="flex flex-col items-center text-center z-10">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              isAppliedDone
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : 'bg-navy-700 border-navy-700 text-white'
            }`}
          >
            {isAppliedDone ? <Check className="w-3.5 h-3.5" /> : '1'}
          </div>
          <span className="text-[11px] font-semibold text-navy-900 mt-1.5">
            Applied
          </span>
          <span className="text-[10px] text-grey-500">
            {isAppliedDone ? 'Completed' : 'Current stage'}
          </span>
        </div>

        {/* Step 2: Shortlisted */}
        <div className="flex flex-col items-center text-center z-10">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              isShortlistedDone
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : status === 'SHORTLISTED'
                ? 'bg-navy-700 border-navy-700 text-white'
                : 'bg-surface border-grey-300 text-grey-400'
            }`}
          >
            {isShortlistedDone ? (
              <Check className="w-3.5 h-3.5" />
            ) : status === 'SHORTLISTED' ? (
              '2'
            ) : (
              <Circle className="w-2.5 h-2.5 fill-grey-300 text-grey-300" />
            )}
          </div>
          <span
            className={`text-[11px] font-semibold mt-1.5 ${
              status === 'SHORTLISTED'
                ? 'text-navy-900 font-bold'
                : isShortlistedDone
                ? 'text-navy-900'
                : 'text-grey-500'
            }`}
          >
            Shortlisted
          </span>
          <span className="text-[10px] text-grey-500">
            {isShortlistedDone
              ? 'Completed'
              : status === 'SHORTLISTED'
              ? 'Current stage'
              : 'Pending'}
          </span>
        </div>

        {/* Step 3: Interview */}
        <div className="flex flex-col items-center text-center z-10">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              isInterviewDone
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : status === 'INTERVIEW'
                ? 'bg-navy-700 border-navy-700 text-white'
                : 'bg-surface border-grey-300 text-grey-400'
            }`}
          >
            {isInterviewDone ? (
              <Check className="w-3.5 h-3.5" />
            ) : status === 'INTERVIEW' ? (
              '3'
            ) : (
              <Circle className="w-2.5 h-2.5 fill-grey-300 text-grey-300" />
            )}
          </div>
          <span
            className={`text-[11px] font-semibold mt-1.5 ${
              status === 'INTERVIEW'
                ? 'text-navy-900 font-bold'
                : isInterviewDone
                ? 'text-navy-900'
                : 'text-grey-500'
            }`}
          >
            Interview
          </span>
          <span className="text-[10px] text-grey-500">
            {isInterviewDone
              ? 'Completed'
              : status === 'INTERVIEW'
              ? 'In progress'
              : 'Pending'}
          </span>
        </div>

        {/* Step 4: Result */}
        <div className="flex flex-col items-center text-center z-10">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              isSelected
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : isRejected
                ? 'bg-danger border-danger text-white'
                : isUnderReview
                ? 'bg-warning border-warning text-white'
                : 'bg-surface border-grey-300 text-grey-400'
            }`}
          >
            {isSelected ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isRejected ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : isUnderReview ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              '4'
            )}
          </div>

          <span
            className={`text-[11px] font-semibold mt-1.5 ${
              isSelected
                ? 'text-emerald-800'
                : isRejected
                ? 'text-danger'
                : isUnderReview
                ? 'text-warning'
                : 'text-grey-500'
            }`}
          >
            {isSelected
              ? 'Selected'
              : isRejected
              ? 'Not selected'
              : isUnderReview
              ? 'Under review'
              : 'Result'}
          </span>

          <span
            className={`text-[10px] ${
              isUnderReview ? 'text-warning font-medium' : 'text-grey-500'
            }`}
          >
            {isSelected
              ? 'Offer released'
              : isRejected
              ? 'Final decision'
              : isUnderReview
              ? 'Result not published yet'
              : 'Awaiting round'}
          </span>
        </div>
      </div>
    </div>
  );
};
