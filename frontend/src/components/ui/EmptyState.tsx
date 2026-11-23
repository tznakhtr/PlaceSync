import React from 'react';
import { Card } from './Card';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state view with title, description, and action button.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-navy-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-grey-500 max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </Card>
  );
};
