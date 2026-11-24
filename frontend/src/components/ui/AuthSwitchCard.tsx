import React from 'react';
import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';

export interface AuthSwitchCardProps {
  currentTab: 'student' | 'admin';
  onSwitch: () => void;
  className?: string;
}

/**
 * AuthSwitchCard:
 * Soft secondary card placed at the bottom of the login container.
 * Invites the user to switch to the opposing authentication portal with clear visual context.
 */
export const AuthSwitchCard: React.FC<AuthSwitchCardProps> = ({
  currentTab,
  onSwitch,
  className = '',
}) => {
  const isStudent = currentTab === 'student';

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-between gap-3 text-left ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-lg bg-surface border border-navy-100 flex items-center justify-center shrink-0 text-navy-700 shadow-sm"
          aria-hidden="true"
        >
          {isStudent ? (
            <ShieldCheck className="w-5 h-5 text-navy-700" />
          ) : (
            <GraduationCap className="w-5 h-5 text-navy-700" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-navy-900 truncate">
            {isStudent ? 'Admin Login' : 'Student Login'}
          </p>
          <p className="text-xs text-grey-500 mt-0.5">
            {isStudent
              ? 'Authorized administrator access only.'
              : 'Back to student sign in.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onSwitch}
        className="inline-flex items-center gap-1.5 min-h-[44px] px-2.5 text-xs font-semibold text-navy-700 hover:text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-colors shrink-0"
        aria-label={`Switch to ${isStudent ? 'Admin Login' : 'Student Login'}`}
      >
        <span>Click here</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};
