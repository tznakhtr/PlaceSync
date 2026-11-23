import React from 'react';
import { Button } from '../../../components/ui/Button';

export interface BranchCheckboxGroupProps {
  branches: string[];
  selectedBranches: string[];
  onChange: (branches: string[]) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Checkbox group for selecting allowed engineering branches.
 * Features a "Select all / Deselect all" toggle button.
 */
export const BranchCheckboxGroup: React.FC<BranchCheckboxGroupProps> = ({
  branches,
  selectedBranches = [],
  onChange,
  error,
  disabled = false,
}) => {
  const allSelected =
    branches.length > 0 && branches.every((b) => selectedBranches.includes(b));

  const handleToggleAll = () => {
    if (disabled) return;
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...branches]);
    }
  };

  const handleToggleBranch = (branch: string) => {
    if (disabled) return;
    if (selectedBranches.includes(branch)) {
      onChange(selectedBranches.filter((b) => b !== branch));
    } else {
      onChange([...selectedBranches, branch]);
    }
  };

  return (
    <div className="w-full text-left space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-grey-700">
          Allowed Engineering Branches <span className="text-danger">*</span>
        </label>
        {branches.length > 0 && !disabled && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleToggleAll}
            className="text-xs py-1 px-2.5 h-auto"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {branches.map((b) => {
          const isChecked = selectedBranches.includes(b);
          return (
            <label
              key={b}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                isChecked
                  ? 'border-emerald-500 bg-emerald-100/30 text-emerald-900 font-semibold shadow-xs'
                  : 'border-grey-200 bg-surface text-grey-700 hover:bg-grey-50'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled}
                onChange={() => handleToggleBranch(b)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 focus:ring-offset-0 border-grey-300"
              />
              <span>{b}</span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium mt-1.5">{error}</p>
      ) : (
        <p className="text-xs text-grey-500 mt-1">
          Students must belong to at least one of the selected branches to be eligible.
        </p>
      )}
    </div>
  );
};
