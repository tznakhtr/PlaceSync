import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SelectedStudentsTable } from './SelectedStudentsTable';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { Drive } from '../../../types/drive';
import type { DriveApplicationsSummary } from '../../../types/application';
import type { DriveResults } from '../../../types/results';

export interface PublishedResultsProps {
  drive: Drive;
  summary?: DriveApplicationsSummary;
  results?: DriveResults;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

/**
 * PublishedResults:
 * Dashboard view for COMPLETED drives showing the permanent locked banner,
 * aggregate outcome statistics, and the searchable table of selected students.
 */
export const PublishedResults: React.FC<PublishedResultsProps> = ({
  drive,
  summary,
  results,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const selectedStudents = results?.selected || [];
  const totalCount = summary?.total ?? selectedStudents.length;
  const selectedCount = summary?.SELECTED ?? selectedStudents.length;
  const notSelectedCount = summary?.REJECTED ?? Math.max(0, totalCount - selectedCount);

  return (
    <div className="space-y-6">
      {/* 1. Permanent Locked Status Banner */}
      <div className="p-4 rounded-xl bg-navy-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Results are published. This drive is locked.</p>
            <p className="text-xs text-grey-300 mt-0.5">
              Candidate decisions are finalized and student notifications delivered. No further updates are permitted.
            </p>
          </div>
        </div>

        <Link to={`/cell/applicants?driveId=${drive.id}`}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Users className="w-3.5 h-3.5" />}
            className="bg-navy-800 text-white border-navy-700 hover:bg-navy-700 hover:text-white whitespace-nowrap self-start sm:self-auto"
          >
            View applicants
          </Button>
        </Link>
      </div>

      {/* 2. Outcome Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Applicants */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-grey-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applicants</span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-navy-900 tracking-tight">{totalCount}</span>
            <p className="text-xs text-grey-500 mt-0.5">Total candidate pool</p>
          </div>
        </Card>

        {/* Selected */}
        <Card className="p-4 flex flex-col justify-between border-emerald-500/30 bg-emerald-50/10">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Selected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-800 tracking-tight">{selectedCount}</span>
            <p className="text-xs text-grey-500 mt-0.5">Offered employment</p>
          </div>
        </Card>

        {/* Not Selected */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-grey-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Not Selected</span>
            <div className="w-8 h-8 rounded-lg bg-grey-100 text-grey-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-grey-700 tracking-tight">{notSelectedCount}</span>
            <p className="text-xs text-grey-500 mt-0.5">Rejected or not shortlisted</p>
          </div>
        </Card>
      </div>

      {/* 3. Error Banner if Results Fetch Fails */}
      {isError && (
        <div className="p-4 rounded-xl bg-danger-bg border border-danger/20 flex items-center justify-between gap-3 text-sm text-danger">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{getErrorMessage(error, 'Failed to load selected student records.')}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4. Selected Candidates Table */}
      <div>
        <div className="mb-3">
          <h3 className="text-base font-bold text-navy-900 tracking-tight">Selected Candidates</h3>
          <p className="text-xs text-grey-500">
            Official list of students hired through {drive.companyName}.
          </p>
        </div>

        <SelectedStudentsTable
          selectedStudents={selectedStudents}
          companyName={drive.companyName}
          role={drive.role}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
