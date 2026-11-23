import React from 'react';
import type { DriveStatus } from '../../types/drive';

export interface DriveStatusBadgeProps {
  status: DriveStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  OPEN: {
    label: 'Open',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-100',
  },
  CLOSED: {
    label: 'Closed',
    classes: 'bg-grey-50 text-grey-700 border-grey-200',
  },
  COMPLETED: {
    label: 'Completed',
    classes: 'bg-navy-100 text-navy-700 border-navy-100',
  },
};

/**
 * Badge displaying the current status of a placement drive:
 * - OPEN: emerald-100 / emerald-800
 * - CLOSED: grey-50 / grey-700
 * - COMPLETED: navy-100 / navy-700
 */
export const DriveStatusBadge: React.FC<DriveStatusBadgeProps> = ({
  status,
  className = '',
}) => {
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
