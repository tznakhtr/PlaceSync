import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight, UserCheck, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ApplyAction } from './ApplyAction';
import type { Drive } from '../../../types/drive';

export interface EligibilityPanelProps {
  drive: Drive;
  isProfileComplete?: boolean;
}

/**
 * Student Eligibility Panel for Drive Details Page.
 * Displays backend evaluation result:
 * - Eligible: Emerald card
 * - Not Eligible: Warning/danger card listing every failure reason
 * - Includes link to /student/profile if incomplete
 * - Displays clearly marked apply-action slot: <div data-slot="apply-action">
 */
export const EligibilityPanel: React.FC<EligibilityPanelProps> = ({
  drive,
  isProfileComplete = true,
}) => {
  const eligibility = drive.eligibility;
  const isEligible = eligibility?.eligible ?? false;
  const reasons = eligibility?.reasons ?? [];

  return (
    <Card className="p-6">
      <div className="border-b border-grey-200 pb-3 mb-4">
        <h3 className="text-base font-bold text-navy-900">Application Eligibility</h3>
        <p className="text-xs text-grey-500 mt-0.5">
          Automated evaluation based on criteria set by the placement cell.
        </p>
      </div>

      {isEligible ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-100/40 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-800">
                You are eligible for this drive
              </h4>
              <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                Your academic record satisfies all minimum cutoff criteria for this recruitment process.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-danger/30 bg-danger-bg/50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-danger">
                You are not eligible for this drive
              </h4>
              <p className="text-xs text-grey-700 mt-1 mb-2.5">
                Your profile does not satisfy one or more requirements:
              </p>
              <ul className="space-y-1.5">
                {reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-medium text-danger">
                    <XCircle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Notice if profile is incomplete */}
      {!isProfileComplete && (
        <div className="mt-3.5 flex items-center justify-between p-3 rounded-lg bg-navy-50 border border-navy-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-navy-900">
              Your profile is incomplete. Complete it to ensure accurate evaluation.
            </span>
          </div>
          <Link
            to="/student/profile"
            className="text-xs font-bold text-navy-700 hover:text-navy-900 inline-flex items-center gap-0.5 shrink-0"
          >
            <span>Update Profile</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Apply Action Slot */}
      <div data-slot="apply-action" className="mt-5 pt-4 border-t border-grey-200">
        <ApplyAction drive={drive} />
      </div>
    </Card>
  );
};
