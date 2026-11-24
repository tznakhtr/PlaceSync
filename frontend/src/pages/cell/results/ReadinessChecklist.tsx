import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { formatDateTime, getDeadlineInfo } from '../../../utils/format';
import type { Drive } from '../../../types/drive';
import type { DriveApplicationsSummary } from '../../../types/application';

export interface ReadinessChecklistProps {
  drive: Drive;
  summary: DriveApplicationsSummary;
}

/**
 * ReadinessChecklist:
 * Pre-publishing diagnostic checklist evaluating applicant counts, pending decisions,
 * drive status, and application deadlines. Every row includes both an explicit icon and descriptive text.
 */
export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ drive, summary }) => {
  const pendingCount = summary.APPLIED + summary.SHORTLISTED + summary.INTERVIEW;
  const deadlineInfo = getDeadlineInfo(drive.deadline);
  const isDeadlineFuture = !deadlineInfo.isPast;
  const isOpen = drive.status === 'OPEN';

  return (
    <Card className="p-5 space-y-3">
      <div className="border-b border-grey-200/60 pb-2 mb-2">
        <h3 className="text-sm font-bold text-navy-900 tracking-tight">
          Publishing Readiness Checklist
        </h3>
        <p className="text-xs text-grey-500 mt-0.5">
          Review recruitment requirements and state warnings before finalizing drive outcomes.
        </p>
      </div>

      <div className="space-y-2.5 text-xs">
        {/* Row 1: Applicants count */}
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            summary.total === 0
              ? 'bg-danger-bg/40 border-danger/30 text-danger'
              : 'bg-emerald-50/40 border-emerald-500/20 text-emerald-900'
          }`}
        >
          {summary.total === 0 ? (
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              Applicants: {summary.total}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {summary.total === 0
                ? 'Problem: No candidates have applied to this placement drive. Results cannot be published.'
                : 'Ready: At least one student applicant is registered for this drive.'}
            </p>
          </div>
        </div>

        {/* Row 2: Pending decisions */}
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            pendingCount > 0
              ? 'bg-warning-bg/40 border-warning/30 text-warning'
              : 'bg-emerald-50/40 border-emerald-500/20 text-emerald-900'
          }`}
        >
          {pendingCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              Pending decisions: {pendingCount}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {pendingCount > 0
                ? `Attention: ${pendingCount} candidate${pendingCount === 1 ? '' : 's'} are still in review. You must decide them or enable auto-rejection below.`
                : 'Ready: All applicants have received a definitive Selected or Rejected outcome.'}
            </p>
          </div>
        </div>

        {/* Row 3: Drive status (Open vs Closed) */}
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            isOpen
              ? 'bg-warning-bg/40 border-warning/30 text-warning'
              : 'bg-emerald-50/40 border-emerald-500/20 text-emerald-900'
          }`}
        >
          {isOpen ? (
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              Drive status: {drive.status === 'OPEN' ? 'Open' : 'Closed'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isOpen
                ? 'Warning: This drive is still open. Publishing will automatically close it and no new student applications will be accepted.'
                : 'Ready: Drive is closed. No new student applications are being submitted.'}
            </p>
          </div>
        </div>

        {/* Row 4: Deadline check */}
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            isDeadlineFuture
              ? 'bg-warning-bg/40 border-warning/30 text-warning'
              : 'bg-emerald-50/40 border-emerald-500/20 text-emerald-900'
          }`}
        >
          {isDeadlineFuture ? (
            <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              Application deadline: {isDeadlineFuture ? 'In the future' : 'Passed'} ({formatDateTime(drive.deadline)})
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isDeadlineFuture
                ? 'Notice: The application deadline has not passed yet. Students may still be intending to apply if the drive is open.'
                : 'Ready: The posted application deadline has concluded.'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
