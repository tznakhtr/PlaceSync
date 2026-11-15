import React from 'react';
import { UserCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const StudentProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Profile</h1>
        <p className="text-sm text-grey-500 mt-1">
          Manage your academic details, technical skills, and uploaded resume.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mb-4">
          <UserCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-navy-900 mb-1">Student Profile Management</h3>
        <p className="text-sm text-grey-500 max-w-md">
          Profile editor with resume PDF upload to Cloudinary will be connected in Task F2.
        </p>
        <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-700">
          Coming soon
        </span>
      </Card>
    </div>
  );
};
