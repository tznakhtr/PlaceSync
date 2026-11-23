import React from 'react';
import {
  CheckCircle2,
  FileCheck,
  FileQuestion,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import type { ApplicationStatus, DriveApplicationsSummary } from '../../../types/application';

export interface ApplicationsSummaryFunnelProps {
  summary: DriveApplicationsSummary;
  activeStatus?: ApplicationStatus | 'ALL';
  onStatusClick?: (status: ApplicationStatus | 'ALL') => void;
}

/**
 * ApplicationsSummaryFunnel:
 * Visual metric cards showing counts for Total, Applied, Shortlisted, Interview, Selected, Rejected.
 * Interactive: clicking a card toggles the status filter.
 */
export const ApplicationsSummaryFunnel: React.FC<ApplicationsSummaryFunnelProps> = ({
  summary,
  activeStatus = 'ALL',
  onStatusClick,
}) => {
  const items: Array<{
    status: ApplicationStatus | 'ALL';
    label: string;
    count: number;
    icon: React.ReactNode;
    colorClasses: string;
    activeBorder: string;
  }> = [
    {
      status: 'ALL',
      label: 'Total Applicants',
      count: summary.total,
      icon: <Users className="w-4 h-4" />,
      colorClasses: 'bg-navy-50 text-navy-700',
      activeBorder: 'ring-2 ring-navy-700 border-navy-700',
    },
    {
      status: 'APPLIED',
      label: 'Applied',
      count: summary.APPLIED,
      icon: <FileQuestion className="w-4 h-4" />,
      colorClasses: 'bg-grey-50 text-grey-700',
      activeBorder: 'ring-2 ring-grey-400 border-grey-400',
    },
    {
      status: 'SHORTLISTED',
      label: 'Shortlisted',
      count: summary.SHORTLISTED,
      icon: <FileCheck className="w-4 h-4" />,
      colorClasses: 'bg-navy-100 text-navy-800',
      activeBorder: 'ring-2 ring-navy-700 border-navy-700',
    },
    {
      status: 'INTERVIEW',
      label: 'Interview',
      count: summary.INTERVIEW,
      icon: <UserCheck className="w-4 h-4" />,
      colorClasses: 'bg-navy-700 text-white',
      activeBorder: 'ring-2 ring-navy-900 border-navy-900',
    },
    {
      status: 'SELECTED',
      label: 'Selected',
      count: summary.SELECTED,
      icon: <CheckCircle2 className="w-4 h-4" />,
      colorClasses: 'bg-emerald-100 text-emerald-800',
      activeBorder: 'ring-2 ring-emerald-600 border-emerald-600',
    },
    {
      status: 'REJECTED',
      label: 'Rejected',
      count: summary.REJECTED,
      icon: <XCircle className="w-4 h-4" />,
      colorClasses: 'bg-danger-bg text-danger',
      activeBorder: 'ring-2 ring-danger border-danger',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => {
        const isSelected = activeStatus === item.status;
        return (
          <button
            key={item.status}
            type="button"
            onClick={() => onStatusClick?.(item.status)}
            className={`flex flex-col items-start p-3.5 rounded-xl bg-surface border text-left transition-all ${
              isSelected
                ? `${item.activeBorder} shadow-sm bg-surface`
                : 'border-grey-200 hover:border-grey-300 hover:shadow-soft'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-medium text-grey-500 truncate">{item.label}</span>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.colorClasses}`}
              >
                {item.icon}
              </div>
            </div>
            <span className="text-xl font-bold text-navy-900 tracking-tight">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
};
