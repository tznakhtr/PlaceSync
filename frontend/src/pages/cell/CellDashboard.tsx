import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase, Clock, Plus, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatCard } from '../../components/ui/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getDrives } from '../../api/driveApi';
import { formatTodayDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AttentionWidget } from './dashboard/AttentionWidget';
import { ClosingSoonWidget } from './dashboard/ClosingSoonWidget';
import { CompletedDrivesWidget } from './dashboard/CompletedDrivesWidget';

/**
 * CellDashboard:
 * Placement Cell command center with quick actions, drive volume statistics,
 * candidate attention queues, closing drives, and recent outcome registries.
 */
export const CellDashboard: React.FC = () => {
  usePageTitle('Placement Dashboard');
  const { user } = useAuth();

  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : 'Coordinator';
  const todayFormatted = formatTodayDate();

  // 1. OPEN drives query (limit 50)
  const { data: openResponse, isLoading: isOpenLoading } = useQuery({
    queryKey: ['drives', { status: 'OPEN', limit: 50 }],
    queryFn: () => getDrives({ status: 'OPEN', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // 2. CLOSED drives query (limit 50)
  const { data: closedResponse, isLoading: isClosedLoading } = useQuery({
    queryKey: ['drives', { status: 'CLOSED', limit: 50 }],
    queryFn: () => getDrives({ status: 'CLOSED', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // 3. COMPLETED drives query (limit 50)
  const { data: completedResponse, isLoading: isCompletedLoading } = useQuery({
    queryKey: ['drives', { status: 'COMPLETED', limit: 50 }],
    queryFn: () => getDrives({ status: 'COMPLETED', limit: 50 }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const isLoading = isOpenLoading || isClosedLoading || isCompletedLoading;

  const openTotal = openResponse?.meta.total ?? 0;
  const closedTotal = closedResponse?.meta.total ?? 0;
  const completedTotal = completedResponse?.meta.total ?? 0;

  // Calculate sum of applicationsCount across all loaded drives
  const totalApplications = useMemo(() => {
    const openDrives = openResponse?.data || [];
    const closedDrives = closedResponse?.data || [];
    const completedDrives = completedResponse?.data || [];
    return [...openDrives, ...closedDrives, ...completedDrives].reduce(
      (sum, d) => sum + (d.applicationsCount ?? 0),
      0,
    );
  }, [openResponse, closedResponse, completedResponse]);

  const hasMoreThan50 = openTotal > 50 || closedTotal > 50 || completedTotal > 50;

  // First-use state: When all three counts are 0 and loading is done
  const isFirstUse = !isLoading && openTotal === 0 && closedTotal === 0 && completedTotal === 0;

  return (
    <div className="space-y-6">
      {/* Header: Title, Greeting, Date & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
              Placement dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-grey-500 mt-1">
            Welcome back, {firstName} • {todayFormatted}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/cell/drives/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create drive
            </Button>
          </Link>
          <Link to="/cell/applicants">
            <Button variant="secondary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Applicants
            </Button>
          </Link>
          <Link to="/cell/results">
            <Button variant="secondary" size="sm" leftIcon={<Award className="w-4 h-4" />}>
              Results
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards (1 col mobile, 2 sm, 4 lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Open drives"
          value={openTotal}
          isLoading={isOpenLoading}
          link="/cell/drives?status=OPEN"
          icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Closed drives"
          value={closedTotal}
          isLoading={isClosedLoading}
          link="/cell/drives?status=CLOSED"
          icon={<Clock className="w-5 h-5 text-grey-500" />}
        />
        <StatCard
          label="Completed (results published)"
          value={completedTotal}
          isLoading={isCompletedLoading}
          link="/cell/drives?status=COMPLETED"
          icon={<Award className="w-5 h-5 text-navy-700" />}
        />
        <StatCard
          label="Total applications"
          value={totalApplications}
          isLoading={isLoading}
          helperText={hasMoreThan50 ? 'Counts use the first 50 drives per status.' : undefined}
          icon={<Users className="w-5 h-5 text-navy-700" />}
        />
      </div>

      {/* Main Content Area */}
      {isFirstUse ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8 text-navy-700" />}
          title="Create your first drive"
          description="Post your first campus recruitment drive to start accepting student applications."
          action={
            <Link to="/cell/drives/new">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Create drive
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Drives that need your attention */}
          <div className="lg:col-span-7 space-y-6">
            <AttentionWidget />
          </div>

          {/* Right Column: Closing soon & Recently completed */}
          <div className="lg:col-span-5 space-y-6">
            <ClosingSoonWidget />
            <CompletedDrivesWidget />
          </div>
        </div>
      )}
    </div>
  );
};
