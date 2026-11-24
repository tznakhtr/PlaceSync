import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

export interface StatCardProps {
  label: string;
  value?: number | string | React.ReactNode;
  icon?: React.ReactNode;
  link?: string;
  helperText?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * StatCard:
 * Displays a high-level metric value with optional icon, helper text, and navigation link.
 * Renders an animated skeleton while loading.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  link,
  helperText,
  isLoading = false,
  className = '',
}) => {
  const cardBody = (
    <Card
      padding="md"
      className={`h-full relative overflow-hidden transition-all duration-150 ${
        link ? 'hover:border-grey-300 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-grey-500 uppercase tracking-wider truncate mb-1">
            {label}
          </p>

          {isLoading ? (
            <div className="space-y-1.5 py-1">
              <Skeleton className="h-8 w-20" />
            </div>
          ) : (
            <div className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
              {value ?? 0}
            </div>
          )}

          {helperText && (
            <p className="text-xs text-grey-400 mt-1.5 leading-snug">
              {helperText}
            </p>
          )}
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
      >
        {cardBody}
      </Link>
    );
  }

  return cardBody;
};
