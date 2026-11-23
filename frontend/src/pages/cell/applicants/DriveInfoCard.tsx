import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Clock,
  Edit2,
  ExternalLink,
  IndianRupee,
  MapPin,
  Users,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { DriveStatusBadge } from '../../../components/ui/DriveStatusBadge';
import { formatLpa } from '../../../utils/format';
import type { Drive } from '../../../types/drive';

export interface DriveInfoCardProps {
  drive: Drive;
}

/**
 * DriveInfoCard:
 * Displays active drive parameters, package, deadline, status badge, skills, and applications count.
 * Shows completed drive warning banner if results are already published.
 */
export const DriveInfoCard: React.FC<DriveInfoCardProps> = ({ drive }) => {
  const isCompleted = drive.status === 'COMPLETED';

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-navy-900 tracking-tight">
              {drive.companyName}
            </h2>
            <DriveStatusBadge status={drive.status} />
          </div>
          <p className="text-sm font-medium text-grey-700 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-grey-400" />
            <span>{drive.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Link to={`/cell/drives/${drive.id}/edit`}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit drive
              </Button>
            </Link>
          )}
          <Link to={`/student/drives/${drive.id}`} target="_blank" rel="noopener noreferrer">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Public view
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Badges & Details Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-grey-200/60 text-xs text-grey-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-grey-400">Package (CTC)</p>
            <p className="font-semibold text-navy-900">{formatLpa(drive.packageLpa)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-grey-400">Location</p>
            <p className="font-medium text-navy-900 truncate">
              {drive.location || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-grey-400">Deadline</p>
            <div className="font-medium">
              <DeadlineLabel deadline={drive.deadline} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-grey-400">Total Applicants</p>
            <p className="font-semibold text-navy-900">
              {drive.applicationsCount ?? 0} applied
            </p>
          </div>
        </div>
      </div>

      {/* Required Skills Chips */}
      {drive.requiredSkills && drive.requiredSkills.length > 0 && (
        <div className="pt-2 border-t border-grey-200/60 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-grey-500 uppercase tracking-wider">
            Required Skills:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {drive.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-navy-50 text-navy-800 border border-navy-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETED / Results Published Banner */}
      {isCompleted && (
        <div className="p-3 rounded-lg bg-warning-bg border border-warning/20 flex items-center gap-2.5 text-xs text-warning">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Results are published:</strong> This drive is marked as COMPLETED. Candidate
            statuses can no longer be modified.
          </span>
        </div>
      )}
    </Card>
  );
};
