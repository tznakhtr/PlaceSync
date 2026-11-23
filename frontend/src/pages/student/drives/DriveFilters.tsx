import React, { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';

export interface DriveFiltersProps {
  search: string;
  status: string;
  eligibleOnly: boolean;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onEligibleOnlyChange: (eligibleOnly: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Filter bar for Student Drives List:
 * - Debounced search input (400ms)
 * - Status dropdown (All, Open, Closed, Completed)
 * - "Eligible for me only" toggle switch
 * - Clear filters button when active
 */
export const DriveFilters: React.FC<DriveFiltersProps> = ({
  search,
  status,
  eligibleOnly,
  onSearchChange,
  onStatusChange,
  onEligibleOnlyChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  // Local state for 400ms debounced search input
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  // Sync external search changes (e.g. on clear or back/forward) during render
  if (search !== prevSearch) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  return (
    <div className="bg-surface border border-grey-200 rounded-xl p-4 shadow-soft space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search & Status dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-grey-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by company or role..."
              className="w-full rounded-lg border border-grey-200 bg-surface text-grey-700 text-sm py-2 pl-9 pr-3 transition-colors placeholder:text-grey-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-44">
            <Select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="py-2 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
        </div>

        {/* Right: Eligible for me toggle switch & Clear button */}
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-grey-200/60">
          <Switch
            id="eligible-only-switch"
            checked={eligibleOnly}
            onChange={onEligibleOnlyChange}
            label="Eligible for me only"
          />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
