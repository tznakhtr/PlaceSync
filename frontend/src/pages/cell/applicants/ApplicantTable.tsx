import React from 'react';
import { ExternalLink, FileText, Phone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatDateTime } from '../../../utils/format';
import { getAllowedNextStatuses, getStatusActionLabel } from '../../../utils/applicationRules';
import type { ApplicationStatus, DriveApplicant } from '../../../types/application';

export interface ApplicantTableProps {
  applicants: DriveApplicant[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSingleStatusChange: (applicant: DriveApplicant, nextStatus: ApplicationStatus) => void;
  isCompletedDrive: boolean;
  isUpdatingId?: number | null;
}

/**
 * ApplicantTable:
 * High-density tabular view for desktop screens (md+).
 * Supports row checkboxes, student details, academics, resume link, status badges, and single transition buttons.
 */
export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  applicants,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSingleStatusChange,
  isCompletedDrive,
  isUpdatingId = null,
}) => {
  const allOnPageSelected =
    applicants.length > 0 && applicants.every((app) => selectedIds.has(app.id));
  const isPartiallySelected =
    applicants.some((app) => selectedIds.has(app.id)) && !allOnPageSelected;

  return (
    <div className="bg-surface border border-grey-200 rounded-xl overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" aria-label="Student drive applicants table">
          <thead>
            <tr className="bg-grey-50/80 border-b border-grey-200 text-xs font-semibold text-grey-600 uppercase tracking-wider">
              <th scope="col" className="p-4 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all applicants on page"
                  checked={allOnPageSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-grey-300 text-navy-700 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th scope="col" className="py-3 px-4">Student</th>
              <th scope="col" className="py-3 px-4">Academic & Branch</th>
              <th scope="col" className="py-3 px-4">Skills</th>
              <th scope="col" className="py-3 px-4">Resume</th>
              <th scope="col" className="py-3 px-4">Applied Date</th>
              <th scope="col" className="py-3 px-4">Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-200 text-grey-700">
            {applicants.map((app) => {
              const isSelected = selectedIds.has(app.id);
              const allowedStatuses = getAllowedNextStatuses(app.status);
              const isUpdatingThis = isUpdatingId === app.id;
              const profile = app.student.profile;

              return (
                <tr
                  key={app.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-navy-50/40' : 'hover:bg-grey-50/60'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${app.student.name}`}
                      checked={isSelected}
                      onChange={() => onToggleSelect(app.id)}
                      className="w-4 h-4 rounded border-grey-300 text-navy-700 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  {/* Student Details */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-navy-900">{app.student.name}</div>
                    <div className="text-xs text-grey-500">{app.student.email}</div>
                    {profile?.rollNo && (
                      <div className="text-xs text-grey-400 font-mono mt-0.5">
                        Roll: {profile.rollNo}
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="text-[11px] text-grey-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                  </td>

                  {/* Academic Info */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-navy-900">
                      {profile?.branch || 'General'}
                    </div>
                    <div className="text-xs mt-0.5">
                      <span className="font-semibold text-navy-900">
                        {profile?.cgpa !== undefined ? profile.cgpa.toFixed(2) : '—'} CGPA
                      </span>
                    </div>
                    <div className="text-[11px] text-grey-500 mt-0.5">
                      {profile?.activeBacklogs !== undefined ? (
                        profile.activeBacklogs > 0 ? (
                          <span className="text-danger font-medium">
                            {profile.activeBacklogs} active backlogs
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">0 backlogs</span>
                        )
                      ) : (
                        '—'
                      )}
                      {profile?.graduationYear && ` • Class of ${profile.graduationYear}`}
                    </div>
                  </td>

                  {/* Skills */}
                  <td className="py-3.5 px-4 max-w-[200px]">
                    {profile?.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-grey-100 text-grey-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 3 && (
                          <span className="text-[11px] text-grey-400 font-medium self-center">
                            +{profile.skills.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-grey-400 italic">None listed</span>
                    )}
                  </td>

                  {/* Resume */}
                  <td className="py-3.5 px-4">
                    {profile?.resumeUrl ? (
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Resume</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </a>
                    ) : (
                      <span className="text-xs text-grey-400 italic">No resume</span>
                    )}
                  </td>

                  {/* Applied Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-grey-500">
                    {formatDateTime(app.appliedAt)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={app.status} />
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {!isCompletedDrive && allowedStatuses.length > 0 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {allowedStatuses.map((nextStatus) => {
                          const isReject = nextStatus === 'REJECTED';
                          const isSelect = nextStatus === 'SELECTED';
                          return (
                            <Button
                              key={nextStatus}
                              type="button"
                              variant={isReject ? 'danger' : isSelect ? 'success' : 'secondary'}
                              size="sm"
                              disabled={isUpdatingThis}
                              isLoading={isUpdatingThis}
                              onClick={() => onSingleStatusChange(app, nextStatus)}
                              className="text-xs py-1 px-2"
                            >
                              {getStatusActionLabel(nextStatus)}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-grey-400 italic">
                        {isCompletedDrive ? 'Locked' : 'Final'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
