import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * ProgressBar:
 * Accessible progress bar with percentage readout and ARIA attributes.
 * Track uses grey-200 and fill uses emerald-500 without hardcoded hex colors.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label = 'Progress',
  showPercentage = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium text-grey-700">
          {label && <span>{label}</span>}
          {showPercentage && (
            <span className="font-semibold text-navy-900">{clampedValue}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="w-full h-2.5 bg-grey-200 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
