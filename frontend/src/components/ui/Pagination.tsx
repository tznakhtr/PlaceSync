import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable pagination component.
 * - Previous & Next buttons
 * - "Page X of Y" with total items count
 * - Automatically scrolls to top on page change
 * - Disabled at ends or while loading
 */
export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalCount,
  onPageChange,
  isLoading = false,
  className = '',
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= safeTotalPages;

  const handlePrev = () => {
    if (!isFirstPage && !isLoading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage && !isLoading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onPageChange(page + 1);
    }
  };

  if (totalPages <= 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-grey-200 ${className}`}
    >
      <div className="text-xs sm:text-sm text-grey-500">
        Page <span className="font-semibold text-grey-700">{page}</span> of{' '}
        <span className="font-semibold text-grey-700">{safeTotalPages}</span>
        {totalCount !== undefined && (
          <span className="ml-1.5 text-grey-400">
            ({totalCount} {totalCount === 1 ? 'drive' : 'drives'} total)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handlePrev}
          disabled={isFirstPage || isLoading}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleNext}
          disabled={isLastPage || isLoading}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
