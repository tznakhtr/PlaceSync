import React from 'react';
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { getDeadlineInfo } from '../../utils/format';

export interface DeadlineLabelProps {
  deadline: string | Date;
  className?: string;
  showIcon?: boolean;
}

/**
 * Displays drive deadline with urgency-aware styling:
 * - Normal: grey-500
 * - Under 48 hours (isSoon): warning colors
 * - Passed (isPast): danger colors
 * Always includes text, never color alone.
 */
export const DeadlineLabel: React.FC<DeadlineLabelProps> = ({
  deadline,
  className = '',
  showIcon = true,
}) => {
  const { text, isPast, isSoon } = getDeadlineInfo(deadline);

  let styleClasses = 'text-grey-500 bg-grey-50 border-grey-200';
  let Icon = Clock;

  if (isPast) {
    styleClasses = 'text-danger bg-danger-bg border-danger/20 font-medium';
    Icon = AlertTriangle;
  } else if (isSoon) {
    styleClasses = 'text-warning bg-warning-bg border-warning/20 font-medium';
    Icon = AlertCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${styleClasses} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{text}</span>
    </span>
  );
};
