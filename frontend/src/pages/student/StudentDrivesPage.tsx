import React from 'react';
import { Briefcase } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const StudentDrivesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Placement Drives</h1>
        <p className="text-sm text-grey-500 mt-1">
          Explore upcoming company visits, deadlines, and eligibility criteria.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mb-4">
          <Briefcase className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-navy-900 mb-1">Company Drives Catalog</h3>
        <p className="text-sm text-grey-500 max-w-md">
          Drive discovery with live eligibility evaluation and one-click application will be connected in Task F3.
        </p>
        <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-700">
          Coming soon
        </span>
      </Card>
    </div>
  );
};
