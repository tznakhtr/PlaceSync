import React from 'react';
import { ExternalLink, FileText, Phone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatDateTime } from '../../../utils/format';
import { getAllowedNextStatuses, getStatusActionLabel } from '../../../utils/applicationRules';
import type { ApplicationStatus, DriveApplicant } from '../../../types/application';

export interface ApplicantCardProps {
  applicant: DriveApplicant;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onSingleStatusChange: (applicant: DriveApplicant, nextStatus: ApplicationStatus) => void;
  isCompletedDrive: boolean;
  isUpdating?: boolean;
}

/**
 * ApplicantCard:
 * Mobile-optimized card representation of an applicant.
 */
export const ApplicantCard: React.FC<ApplicantCardProps> = ({
  applicant,
  isSelected,
  onToggleSelect,
  onSingleStatusChange,
  isCompletedDrive,
  isUpdating = false,
}) => {
  const allowedStatuses = getAllowedNextStatuses(applicant.status);
  const profile = applicant.student.profile;

  return (
    <Card
      className={`p-4 space-y-3 transition-colors ${
        isSelected ? 'bg-navy-50/40 border-navy-300' : 'hover:border-grey-300'
      }`}
    >
      {/* Top Row: Checkbox, Name, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            aria-label={`Select ${applicant.student.name}`}
            checked={isSelected}
            onChange={() => onToggleSelect(applicant.id)}
            className="w-4 h-4 mt-0.5 rounded border-grey-300 text-navy-700 focus:ring-emerald-500 cursor-pointer"
          />
          <div>
            <h4 className="text-sm font-bold text-navy-900 leading-snug">
              {applicant.student.name}
            </h4>
            <p className="text-xs text-grey-500">{applicant.student.email}</p>
            {profile?.rollNo && (
              <p className="text-[11px] font-mono text-grey-400">Roll: {profile.rollNo}</p>
            )}
          </div>
        </div>

        <StatusBadge status={applicant.status} />
      </div>

      {/* Academic Info */}
      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-grey-200/60 bg-grey-50/50 rounded-lg px-3">
        <div>
          <span className="text-grey-400 text-[10px] uppercase font-semibold block">Branch</span>
          <span className="font-medium text-navy-900">{profile?.branch || 'General'}</span>
        </div>
        <div>
          <span className="text-grey-400 text-[10px] uppercase font-semibold block">CGPA</span>
          <span className="font-semibold text-navy-900">
            {profile?.cgpa !== undefined ? profile.cgpa.toFixed(2) : '—'}
          </span>
        </div>
        <div>
          <span className="text-grey-400 text-[10px] uppercase font-semibold block">Backlogs</span>
          <span
            className={
              profile?.activeBacklogs && profile.activeBacklogs > 0
                ? 'text-danger font-medium'
                : 'text-emerald-700 font-medium'
            }
          >
            {profile?.activeBacklogs ?? 0} active
          </span>
        </div>
        <div>
          <span className="text-grey-400 text-[10px] uppercase font-semibold block">Applied</span>
          <span className="text-grey-600 truncate block">
            {formatDateTime(applicant.appliedAt)}
          </span>
        </div>
      </div>

      {/* Skills */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-grey-100 text-grey-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Resume & Phone Row */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div>
          {profile?.phone && (
            <span className="text-grey-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-grey-400" />
              <span>{profile.phone}</span>
            </span>
          )}
        </div>

        <div>
          {profile?.resumeUrl ? (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Resume</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>
          ) : (
            <span className="text-xs text-grey-400 italic">No resume</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isCompletedDrive && allowedStatuses.length > 0 && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-grey-200/60">
          {allowedStatuses.map((nextStatus) => {
            const isReject = nextStatus === 'REJECTED';
            const isSelect = nextStatus === 'SELECTED';
            return (
              <Button
                key={nextStatus}
                type="button"
                variant={isReject ? 'danger' : isSelect ? 'success' : 'secondary'}
                size="sm"
                disabled={isUpdating}
                isLoading={isUpdating}
                onClick={() => onSingleStatusChange(applicant, nextStatus)}
                className="text-xs"
              >
                {getStatusActionLabel(nextStatus)}
              </Button>
            );
          })}
        </div>
      )}
    </Card>
  );
};
