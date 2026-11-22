import React from 'react';
import type { ApplicationStatus } from '../../types';

export interface StatusBadgeProps {
  status: ApplicationStatus | string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; classes: string }
> = {
  APPLIED: {
    label: 'Applied',
    classes: 'bg-grey-50 text-grey-700 border-grey-200',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    classes: 'bg-navy-100 text-navy-700 border-navy-100',
  },
  INTERVIEW: {
    label: 'Interview',
    classes: 'bg-navy-700 text-white border-navy-700',
  },
  SELECTED: {
    label: 'Selected',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-100',
  },
  REJECTED: {
    label: 'Rejected',
    classes: 'bg-danger-bg text-danger border-danger-bg',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    classes: 'bg-warning-bg text-warning border-warning-bg',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-grey-50 text-grey-700 border-grey-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
};
