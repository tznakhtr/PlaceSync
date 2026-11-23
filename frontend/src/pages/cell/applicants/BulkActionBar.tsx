import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ApplicationStatus } from '../../../types/application';

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onTriggerBulkStatus: (targetStatus: ApplicationStatus) => void;
  isCompletedDrive: boolean;
  isLoading?: boolean;
}

/**
 * BulkActionBar:
 * Floats or docks when 1 or more applicants are selected.
 * Provides batch transitions: Shortlist, Move to Interview, Select, Reject.
 */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onTriggerBulkStatus,
  isCompletedDrive,
  isLoading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-navy-900 text-white rounded-xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-navy-800 text-emerald-400 flex items-center justify-center font-bold text-sm">
          {selectedCount}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {selectedCount} candidate{selectedCount === 1 ? '' : 's'} selected
          </p>
          <p className="text-xs text-grey-300">
            {isCompletedDrive
              ? 'Results published — status changes disabled'
              : 'Apply atomic status progression in one transaction'}
          </p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {!isCompletedDrive && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={() => onTriggerBulkStatus('SHORTLISTED')}
              className="bg-navy-800 text-white border-navy-700 hover:bg-navy-700 hover:text-white"
            >
              Shortlist
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={() => onTriggerBulkStatus('INTERVIEW')}
              className="bg-navy-800 text-white border-navy-700 hover:bg-navy-700 hover:text-white"
            >
              Interview
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              disabled={isLoading}
              onClick={() => onTriggerBulkStatus('SELECTED')}
            >
              Select
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isLoading}
              onClick={() => onTriggerBulkStatus('REJECTED')}
            >
              Reject
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClearSelection}
          leftIcon={<X className="w-3.5 h-3.5" />}
          className="bg-transparent text-grey-300 border-grey-700 hover:bg-navy-800 hover:text-white"
        >
          Deselect
        </Button>
      </div>
    </div>
  );
};
