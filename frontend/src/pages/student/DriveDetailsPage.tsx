import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  FileQuestion,
  GraduationCap,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DeadlineLabel } from '../../components/ui/DeadlineLabel';
import { DriveStatusBadge } from '../../components/ui/DriveStatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getDrive } from '../../api/driveApi';
import { getStudentProfile } from '../../api/studentApi';
import { formatDateTime, formatLpa } from '../../utils/format';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ForbiddenState } from '../../components/common/ForbiddenState';
import { EligibilityPanel } from './drives/EligibilityPanel';
import { ProfileComparison } from './drives/ProfileComparison';
import { SkillChips } from './drives/SkillChips';

export const DriveDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Parse ID and check if valid number
  const driveId = id ? parseInt(id, 10) : NaN;
  const isInvalidId = isNaN(driveId) || driveId <= 0;

  // Retrieve stored query string from navigation state if available
  const fromSearch = (location.state as { fromSearch?: string })?.fromSearch || '';
  const backLink = `/student/drives${fromSearch}`;

  // Query drive details
  const {
    data: drive,
    isLoading: isDriveLoading,
    isError: isDriveError,
    error: driveError,
    refetch,
  } = useQuery({
    queryKey: ['drive', driveId],
    queryFn: () => getDrive(driveId),
    enabled: !isInvalidId,
  });

  // Cached student profile query from F2
  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
  });

  const profile = profileData?.profile ?? null;
  const isProfileComplete = profileData?.isComplete ?? false;

  const pageTitle = drive?.companyName ? `${drive.companyName} | Drive Details` : 'Drive Details';
  usePageTitle(pageTitle);

  // State: Invalid or Non-numeric ID
  if (isInvalidId) {
    return (
      <div className="space-y-6">
        <Link
          to="/student/drives"
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to drives</span>
        </Link>

        <EmptyState
          icon={<FileQuestion className="w-6 h-6 text-grey-400" />}
          title="Drive Not Found"
          description="The drive identifier provided in the URL is invalid."
          action={
            <Link to="/student/drives">
              <Button variant="primary" size="md">
                Browse Campus Drives
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // State: Loading Skeleton
  if (isDriveLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-grey-200">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
          <div>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-28 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // State: 404 or API Error
  if (isDriveError || !drive) {
    const status = (driveError as { response?: { status?: number } })?.response?.status;
    const is404 = status === 404;
    const is403 = status === 403;

    return (
      <div className="space-y-6">
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to drives</span>
        </Link>

        {is403 ? (
          <ForbiddenState message="You do not have access to view this placement drive." />
        ) : is404 ? (
          <EmptyState
            icon={<FileQuestion className="w-6 h-6 text-grey-400" />}
            title="Drive Not Found"
            description="The placement drive you are trying to view does not exist or may have been removed."
            action={
              <Link to={backLink}>
                <Button variant="primary" size="md">
                  Browse Campus Drives
                </Button>
              </Link>
            }
          />
        ) : (
          <Card className="p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900 mb-1">
              Unable to Load Drive Details
            </h3>
            <p className="text-sm text-grey-500 max-w-md mb-6">
              {getErrorMessage(driveError, 'Could not retrieve drive information. Please try again.')}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry
            </Button>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link preserving previous filter query string */}
      <div>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to drives</span>
        </Link>
      </div>

      {/* Header Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-navy-900">
                  {drive.companyName}
                </h1>
                <p className="text-sm font-medium text-grey-600 mt-0.5">
                  {drive.role}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <DriveStatusBadge status={drive.status} />
            <DeadlineLabel deadline={drive.deadline} />
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-grey-200">
          <div>
            <span className="text-xs text-grey-500 font-medium block">Package</span>
            <span className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5 block">
              {formatLpa(drive.packageLpa)}
            </span>
          </div>

          <div>
            <span className="text-xs text-grey-500 font-medium block">Location</span>
            <span className="text-sm sm:text-base font-semibold text-navy-900 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-grey-400 shrink-0" />
              <span className="truncate">{drive.location || 'Not specified'}</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-grey-500 font-medium block">Graduation Batch</span>
            <span className="text-sm sm:text-base font-semibold text-navy-900 mt-0.5 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-grey-400 shrink-0" />
              <span>{drive.graduationYear} Batch</span>
            </span>
          </div>

          <div>
            <span className="text-xs text-grey-500 font-medium block">Application Deadline</span>
            <span className="text-xs sm:text-sm font-medium text-navy-900 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-grey-400 shrink-0" />
              <span>{formatDateTime(drive.deadline)}</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description & Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role Description (whitespace preserved, plain text, no dangerouslySetInnerHTML) */}
          <Card className="p-6 md:p-8">
            <h2 className="text-base font-bold text-navy-900 border-b border-grey-200 pb-3 mb-4">
              Job Description
            </h2>
            <div className="whitespace-pre-line text-sm text-grey-700 leading-relaxed">
              {drive.description}
            </div>
          </Card>

          {/* Academic & Branch Requirements */}
          <Card className="p-6 md:p-8 space-y-6">
            <h2 className="text-base font-bold text-navy-900 border-b border-grey-200 pb-3">
              Eligibility & Academic Criteria
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-grey-50 border border-grey-200">
                <span className="text-xs text-grey-500 font-medium block">Minimum CGPA</span>
                <span className="text-base font-bold text-navy-900 mt-1 block">
                  {drive.minCgpa.toFixed(2)} / 10.00
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-grey-50 border border-grey-200">
                <span className="text-xs text-grey-500 font-medium block">Max Active Backlogs</span>
                <span className="text-base font-bold text-navy-900 mt-1 block">
                  {drive.maxBacklogs} backlogs
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-grey-50 border border-grey-200">
                <span className="text-xs text-grey-500 font-medium block">Graduation Batch</span>
                <span className="text-base font-bold text-navy-900 mt-1 block">
                  {drive.graduationYear} Passouts
                </span>
              </div>
            </div>

            {/* Allowed Engineering Branches */}
            <div>
              <p className="text-xs font-semibold text-grey-500 uppercase tracking-wider mb-2">
                Eligible Branches
              </p>
              <div className="flex flex-wrap gap-2">
                {drive.allowedBranches.map((branch) => (
                  <span
                    key={branch}
                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100"
                  >
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            {/* Required Skills & Student Match Hint */}
            <div className="pt-4 border-t border-grey-200">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-navy-900">
                  Required Technical Skills & Match Hint
                </h3>
              </div>
              <SkillChips
                requiredSkills={drive.requiredSkills}
                studentSkills={profile?.skills}
              />
            </div>
          </Card>

          {/* Profile vs Requirements Comparison Table */}
          <ProfileComparison drive={drive} profile={profile} />
        </div>

        {/* Right 1 Column: Eligibility Panel & Apply Slot */}
        <div className="space-y-6">
          <EligibilityPanel
            drive={drive}
            isProfileComplete={isProfileComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default DriveDetailsPage;
