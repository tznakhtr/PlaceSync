import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, Sparkles, UserCheck } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-navy-900 to-navy-700 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-800 text-emerald-500 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Student Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-grey-200 mt-1">
              Explore open placement drives, check your eligibility, and track your applications.
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/student/profile" className="block group">
          <Card className="h-full hover:border-emerald-500 transition-all duration-200 group-hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">My Profile</h3>
            <p className="text-xs text-grey-500">
              Keep your CGPA, branch, resume, and skills up to date for eligibility matching.
            </p>
          </Card>
        </Link>

        <Link to="/student/drives" className="block group">
          <Card className="h-full hover:border-emerald-500 transition-all duration-200 group-hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">Placement Drives</h3>
            <p className="text-xs text-grey-500">
              Browse newly posted campus drives and apply before the application deadlines.
            </p>
          </Card>
        </Link>

        <Link to="/student/applications" className="block group">
          <Card className="h-full hover:border-emerald-500 transition-all duration-200 group-hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 mb-1">My Applications</h3>
            <p className="text-xs text-grey-500">
              Track the live interview status, shortlisting updates, and results for your drives.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};
