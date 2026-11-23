import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Reusable animated loading skeleton placeholder.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-grey-200 rounded-lg ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};
