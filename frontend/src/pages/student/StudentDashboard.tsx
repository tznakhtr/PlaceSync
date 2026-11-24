import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase, Clock, FileText } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getDrives } from '../../api/driveApi';
import { getMyApplications } from '../../api/applicationApi';
import { formatTodayDate } from '../../utils/format';
import { countByStatus } from '../../utils/dashboard';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ProfileCompletenessCard } from './dashboard/ProfileCompletenessCard';
import { EligibleDrivesWidget } from './dashboard/EligibleDrivesWidget';
import { ApplicationStatusWidget } from './dashboard/ApplicationStatusWidget';
import { RecentApplicationsWidget } from './dashboard/RecentApplicationsWidget';
import { RecentNotificationsWidget } from './dashboard/RecentNotificationsWidget';

/**
 * StudentDashboard:
 * Central landing page for students with metric statistics, profile status,
 * eligible open drives, application tracking, and recent alerts.
 */
export const StudentDashboard: React.FC = () => {
  usePageTitle('Student Dashboard');
  const { user } = useAuth();

  // Extract first name for personalized greeting
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : 'Student';
  const todayFormatted = formatTodayDate();

  // Stat query 1: Eligible open drives
  const { data: drivesResponse, isLoading: isDrivesLoading } = useQuery({
    queryKey: ['drives', { status: 'OPEN', eligibleOnly: true, limit: 20, page: 1 }],
    queryFn: () => getDrives({ status: 'OPEN', eligibleOnly: true, limit: 20, page: 1 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Stat query 2: Student applications
  const { data: applicationsResponse, isLoading: isAppsLoading } = useQuery({
    queryKey: ['my-applications', { limit: 50 }],
    queryFn: () => getMyApplications({ limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const totalApplications = applicationsResponse?.meta.total ?? 0;
  const applications = applicationsResponse?.data || [];
  const counts = countByStatus(applications);

  const inProgressCount = counts.APPLIED + counts.SHORTLISTED + counts.INTERVIEW;
  const selectedCount = counts.SELECTED;

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-grey-500 mt-1">{todayFormatted}</p>
      </div>

      {/* Stat Cards (1 col mobile, 2 sm, 4 lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Eligible open drives"
          value={drivesResponse?.meta.total ?? 0}
          isLoading={isDrivesLoading}
          link="/student/drives?status=OPEN&eligibleOnly=true"
          icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Applications"
          value={totalApplications}
          isLoading={isAppsLoading}
          link="/student/applications"
          helperText={
            totalApplications > 50 ? 'Counts use your latest 50 applications.' : undefined
          }
          icon={<FileText className="w-5 h-5 text-navy-700" />}
        />
        <StatCard
          label="In progress"
          value={inProgressCount}
          isLoading={isAppsLoading}
          link="/student/applications"
          icon={<Clock className="w-5 h-5 text-navy-700" />}
        />
        <StatCard
          label="Selected"
          value={selectedCount}
          isLoading={isAppsLoading}
          link="/student/applications?status=SELECTED"
          icon={<Award className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* Two Column Layout (Stacks on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Eligible Drives & Recent Applications */}
        <div className="lg:col-span-7 space-y-6">
          <EligibleDrivesWidget />
          <RecentApplicationsWidget />
        </div>

        {/* Right Column: Profile Completeness, Status Breakdown, Notifications */}
        <div className="lg:col-span-5 space-y-6">
          <ProfileCompletenessCard />
          <ApplicationStatusWidget />
          <RecentNotificationsWidget />
        </div>
      </div>
    </div>
  );
};
