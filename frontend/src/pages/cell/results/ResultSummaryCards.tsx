import React from 'react';
import { CheckCircle2, Clock, Users, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { DriveApplicationsSummary } from '../../../types/application';

export interface ResultSummaryCardsProps {
  summary: DriveApplicationsSummary;
}

/**
 * ResultSummaryCards:
 * Displays aggregate counts for Total, Selected, Rejected, and Pending applications.
 * Details the breakdown of pending stages (Applied, Shortlisted, Interview).
 */
export const ResultSummaryCards: React.FC<ResultSummaryCardsProps> = ({ summary }) => {
  const pendingCount = summary.APPLIED + summary.SHORTLISTED + summary.INTERVIEW;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Applicants */}
      <Card className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-grey-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Applicants</span>
          <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold text-navy-900 tracking-tight">{summary.total}</span>
          <p className="text-xs text-grey-500 mt-0.5">Submitted applications</p>
        </div>
      </Card>

      {/* Selected */}
      <Card className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-700 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Selected</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold text-emerald-800 tracking-tight">
            {summary.SELECTED}
          </span>
          <p className="text-xs text-grey-500 mt-0.5">Job offers finalized</p>
        </div>
      </Card>

      {/* Rejected */}
      <Card className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-danger mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
          <div className="w-8 h-8 rounded-lg bg-danger-bg text-danger flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold text-danger tracking-tight">{summary.REJECTED}</span>
          <p className="text-xs text-grey-500 mt-0.5">Explicitly rejected</p>
        </div>
      </Card>

      {/* Pending Decisions */}
      <Card
        className={`p-4 flex flex-col justify-between ${
          pendingCount > 0 ? 'border-warning/40 bg-warning-bg/20' : ''
        }`}
      >
        <div className="flex items-center justify-between text-warning mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Pending Decisions</span>
          <div className="w-8 h-8 rounded-lg bg-warning-bg text-warning flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-navy-900 tracking-tight">
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-medium text-warning">Requires action</span>
            )}
          </div>
          <div className="text-[11px] text-grey-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>Applied: <strong className="text-navy-900">{summary.APPLIED}</strong></span>
            <span>•</span>
            <span>Shortlisted: <strong className="text-navy-900">{summary.SHORTLISTED}</strong></span>
            <span>•</span>
            <span>Interview: <strong className="text-navy-900">{summary.INTERVIEW}</strong></span>
          </div>
        </div>
      </Card>
    </div>
  );
};
