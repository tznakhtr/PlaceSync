import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { DeadlineLabel } from '../../../components/ui/DeadlineLabel';
import { DriveStatusBadge } from '../../../components/ui/DriveStatusBadge';
import { EligibilityBadge } from '../../../components/ui/EligibilityBadge';
import { formatLpa, getDeadlineInfo } from '../../../utils/format';
import type { Drive } from '../../../types/drive';

export interface DriveCardProps {
  drive: Drive;
}

/**
 * Drive card for responsive student drive grid.
 * - Entire card is clickable
 * - Shows company name, role, package, location, DriveStatusBadge, DeadlineLabel, EligibilityBadge
 * - If not eligible, shows FIRST reason in small text with "+N more" when multiple
 * - Muted styling when status is not OPEN or deadline has passed
 */
export const DriveCard: React.FC<DriveCardProps> = ({ drive }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const deadlineInfo = getDeadlineInfo(drive.deadline);
  const isMuted = drive.status !== 'OPEN' || deadlineInfo.isPast;
  const isEligible = drive.eligibility?.eligible ?? false;
  const reasons = drive.eligibility?.reasons ?? [];

  const handleCardClick = () => {
    navigate(`/student/drives/${drive.id}`, {
      state: { fromSearch: location.search },
    });
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`group cursor-pointer p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-grey-300 relative border ${
        isMuted
          ? 'bg-grey-50/70 border-grey-200/90 text-grey-600'
          : 'bg-surface border-grey-200 text-grey-700'
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Header: Company name, Role, DriveStatusBadge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={`font-bold text-base tracking-tight truncate group-hover:text-navy-700 transition-colors ${
                isMuted ? 'text-grey-700' : 'text-navy-900'
              }`}
              title={drive.companyName}
            >
              {drive.companyName}
            </h3>
            <p
              className={`text-xs font-medium truncate mt-0.5 ${
                isMuted ? 'text-grey-500' : 'text-grey-600'
              }`}
              title={drive.role}
            >
              {drive.role}
            </p>
          </div>
          <DriveStatusBadge status={drive.status} className="shrink-0" />
        </div>

        {/* Package & Location */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-bold text-sm text-emerald-700">
            {formatLpa(drive.packageLpa)}
          </span>
          {drive.location && (
            <span className="text-xs text-grey-500 flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 text-grey-400 shrink-0" />
              <span className="truncate">{drive.location}</span>
            </span>
          )}
        </div>

        {/* Deadline & Eligibility Badges */}
        <div className="pt-2 border-t border-grey-200/60 flex items-center justify-between gap-2">
          <DeadlineLabel deadline={drive.deadline} />
          {drive.eligibility !== undefined && (
            <EligibilityBadge eligible={isEligible} />
          )}
        </div>

        {/* Ineligibility Reason Preview: First reason + count */}
        {!isEligible && reasons.length > 0 && (
          <div className="text-[11px] text-danger font-medium leading-tight flex items-center gap-1 mt-1">
            <span className="truncate" title={reasons[0]}>
              {reasons[0]}
            </span>
            {reasons.length > 1 && (
              <span className="text-grey-500 font-semibold shrink-0">
                +{reasons.length - 1} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="mt-4 pt-3 border-t border-grey-200/60 flex items-center justify-between text-xs font-semibold text-navy-700 group-hover:text-navy-900 transition-colors">
        <span>View details</span>
        <ChevronRight className="w-4 h-4 text-grey-400 group-hover:text-navy-700 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Card>
  );
};
