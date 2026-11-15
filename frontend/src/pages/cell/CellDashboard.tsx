import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Building2, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

export const CellDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-navy-900 to-navy-700 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-800 text-emerald-500 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Placement Cell Coordinator
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="text-sm text-grey-200 mt-1">
              Oversee campus recruitment, post new placement drives, review candidates, and publish hiring results.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/cell/drives" className="block group">
          <Card className="h-full hover:border-emerald-500 transition-all duration-200 group-hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">Manage Drives</h3>
            <p className="text-xs text-grey-500">
              Create new hiring drives, set branch and CGPA cutoffs, and manage deadlines.
            </p>
          </Card>
        </Link>

        <Link to="/cell/applicants" className="block group">
          <Card className="h-full hover:border-emerald-500 transition-all duration-200 group-hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">Review Applicants</h3>
            <p className="text-xs text-grey-500">
              Filter candidates by branch and CGPA, review resumes, and bulk-update statuses.
            </p>
          </Card>
        </Link>

        <Link to="/cell/results" className="block group">
          <Card className="h-full hover:border-emerald-500 transition-all duration-200 group-hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">Publish Results</h3>
            <p className="text-xs text-grey-500">
              Finalize selections, auto-reject remaining candidates, and notify students.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};
