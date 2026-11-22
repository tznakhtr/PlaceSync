import React from 'react';

export interface EligibilityBadgeProps {
  eligible: boolean;
  className?: string;
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({
  eligible,
  className = '',
}) => {
  return eligible ? (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-100 ${className}`}
    >
      Eligible
    </span>
  ) : (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-danger-bg text-danger border-danger-bg ${className}`}
    >
      Not Eligible
    </span>
  );
};
