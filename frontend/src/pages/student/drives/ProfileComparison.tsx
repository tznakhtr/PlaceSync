import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { Drive } from '../../../types/drive';
import type { StudentProfile } from '../../../types/student';

export interface ProfileComparisonProps {
  drive: Drive;
  profile: StudentProfile | null;
}

/**
 * Informational comparison table showing drive requirements vs student profile.
 * Does not recompute eligibility; displays side-by-side values with check/cross icons and text.
 */
export const ProfileComparison: React.FC<ProfileComparisonProps> = ({ drive, profile }) => {
  if (!profile) {
    return (
      <Card className="p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mx-auto mb-3">
          <UserCheck className="w-5 h-5 text-emerald-500" />
        </div>
        <h4 className="text-sm font-bold text-navy-900 mb-1">
          Profile Comparison Unavailable
        </h4>
        <p className="text-xs text-grey-500 max-w-sm mx-auto mb-4">
          Complete your academic profile to see how your CGPA, branch, and backlogs compare with this drive.
        </p>
        <Link
          to="/student/profile"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-navy-700 text-white hover:bg-navy-800 transition-colors"
        >
          Complete Your Profile
        </Link>
      </Card>
    );
  }

  // Row evaluations (informational display)
  const rows = [
    {
      criterion: 'CGPA',
      requirement: `Minimum ${drive.minCgpa.toFixed(2)}`,
      yourValue: profile.cgpa.toFixed(2),
      meets: profile.cgpa >= drive.minCgpa,
      passText: 'Meets requirement',
      failText: 'Below requirement',
    },
    {
      criterion: 'Branch',
      requirement: drive.allowedBranches.join(', '),
      yourValue: profile.branch,
      meets: drive.allowedBranches.includes(profile.branch),
      passText: 'Eligible branch',
      failText: 'Branch not allowed',
    },
    {
      criterion: 'Active Backlogs',
      requirement: `Max ${drive.maxBacklogs}`,
      yourValue: `${profile.activeBacklogs} active`,
      meets: profile.activeBacklogs <= drive.maxBacklogs,
      passText: 'Meets requirement',
      failText: 'Exceeds max backlogs',
    },
    {
      criterion: 'Graduation Year',
      requirement: `${drive.graduationYear} Batch`,
      yourValue: `${profile.graduationYear} Batch`,
      meets: profile.graduationYear === drive.graduationYear,
      passText: 'Batch matches',
      failText: 'Batch mismatch',
    },
  ];

  return (
    <Card className="overflow-hidden p-0 border border-grey-200">
      <div className="p-4 sm:p-5 border-b border-grey-200 bg-surface">
        <h3 className="text-base font-bold text-navy-900">Requirements vs Your Profile</h3>
        <p className="text-xs text-grey-500 mt-0.5">
          Side-by-side comparison of your credentials with the recruiter's specifications.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-grey-50 border-b border-grey-200 text-[11px] font-semibold text-grey-500 uppercase tracking-wider">
              <th className="py-2.5 px-4">Criterion</th>
              <th className="py-2.5 px-4">Requirement</th>
              <th className="py-2.5 px-4">Your Profile</th>
              <th className="py-2.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-200 text-xs text-grey-700 bg-surface">
            {rows.map((row) => (
              <tr key={row.criterion} className="hover:bg-grey-50/50 transition-colors">
                <td className="py-3 px-4 font-semibold text-navy-900 whitespace-nowrap">
                  {row.criterion}
                </td>
                <td className="py-3 px-4 text-grey-600">{row.requirement}</td>
                <td className="py-3 px-4 font-medium text-navy-900 whitespace-nowrap">
                  {row.yourValue}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {row.meets ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{row.passText}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                      <XCircle className="w-4 h-4 text-danger shrink-0" />
                      <span>{row.failText}</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
