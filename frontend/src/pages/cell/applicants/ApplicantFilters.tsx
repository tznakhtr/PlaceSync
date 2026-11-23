import React, { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';

export interface ApplicantFiltersProps {
  search: string;
  status: string;
  branch: string;
  minCgpa: string;
  sortBy: 'appliedAt' | 'cgpa';
  order: 'asc' | 'desc';
  branches: string[];
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onBranchChange: (branch: string) => void;
  onMinCgpaChange: (cgpa: string) => void;
  onSortChange: (sortBy: 'appliedAt' | 'cgpa', order: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * ApplicantFilters:
 * Multi-criteria filter bar:
 * - Debounced search (400ms) matching name, email, rollNo
 * - Status filter (All, Applied, Shortlisted, Interview, Selected, Rejected)
 * - Branch dropdown
 * - Min CGPA input
 * - Sort selector (Applied date vs CGPA, asc/desc)
 * - Clear filters button
 */
export const ApplicantFilters: React.FC<ApplicantFiltersProps> = ({
  search,
  status,
  branch,
  minCgpa,
  sortBy,
  order,
  branches = [],
  onSearchChange,
  onStatusChange,
  onBranchChange,
  onMinCgpaChange,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  // Local state for debounced search (400ms)
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  // Sync external search changes during render
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

  const currentSortValue = `${sortBy}_${order}`;

  const handleSortSelection = (val: string) => {
    const [newSortBy, newOrder] = val.split('_') as ['appliedAt' | 'cgpa', 'asc' | 'desc'];
    if (newSortBy && newOrder) {
      onSortChange(newSortBy, newOrder);
    }
  };

  return (
    <div className="bg-surface border border-grey-200 rounded-xl p-4 shadow-soft space-y-3">
      {/* Search and primary filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input (5 cols on lg) */}
        <div className="lg:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-grey-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name, email, roll no..."
            className="w-full rounded-lg border border-grey-200 bg-surface text-grey-700 text-sm py-2 pl-9 pr-3 transition-colors placeholder:text-grey-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>

        {/* Status Dropdown (2 cols on lg) */}
        <div className="lg:col-span-2">
          <Select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="py-2 text-sm w-full"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW">Interview</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>

        {/* Branch Dropdown (2 cols on lg) */}
        <div className="lg:col-span-2">
          <Select
            value={branch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="py-2 text-sm w-full"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>

        {/* Min CGPA Input (2 cols on lg) */}
        <div className="lg:col-span-2">
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={minCgpa}
            onChange={(e) => onMinCgpaChange(e.target.value)}
            placeholder="Min CGPA"
            className="w-full rounded-lg border border-grey-200 bg-surface text-grey-700 text-sm py-2 px-3 transition-colors placeholder:text-grey-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>

        {/* Sort By Dropdown (2 cols on lg) */}
        <div className="lg:col-span-2">
          <Select
            value={currentSortValue}
            onChange={(e) => handleSortSelection(e.target.value)}
            className="py-2 text-sm w-full"
          >
            <option value="appliedAt_desc">Applied (Newest)</option>
            <option value="appliedAt_asc">Applied (Oldest)</option>
            <option value="cgpa_desc">CGPA (Highest)</option>
            <option value="cgpa_asc">CGPA (Lowest)</option>
          </Select>
        </div>
      </div>

      {/* Clear Filters Row */}
      {hasActiveFilters && (
        <div className="flex items-center justify-end pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClearFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};
