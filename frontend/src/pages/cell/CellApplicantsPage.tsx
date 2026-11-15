import React from 'react';
import { Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const CellApplicantsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Applicant Review & Progression</h1>
        <p className="text-sm text-grey-500 mt-1">
          Review student profiles, view resumes, and update recruitment statuses.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-navy-900 mb-1">Applicant Management Dashboard</h3>
        <p className="text-sm text-grey-500 max-w-md">
          Applicant sorting, multi-status bulk transitions, and resume links in Task F6.
        </p>
        <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-700">
          Coming soon
        </span>
      </Card>
    </div>
  );
};
