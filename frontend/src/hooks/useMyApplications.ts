import { useQuery } from '@tanstack/react-query';
import { getMyApplications } from '../api/applicationApi';
import type { Application } from '../types/application';

/**
 * Shared hook to load and check student applications.
 * Fetches up to 50 applications to check whether the student has applied to any drive.
 * Cached with query key ['my-applications', { limit: 50 }].
 */
export function useMyApplications() {
  const query = useQuery({
    queryKey: ['my-applications', { limit: 50 }],
    queryFn: () => getMyApplications({ limit: 50 }),
    staleTime: 1000 * 60, // 1 minute
  });

  const applications: Application[] = query.data?.data ?? [];

  const getApplicationForDrive = (driveId: number): Application | undefined => {
    return applications.find((app) => app.drive.id === driveId);
  };

  const hasAppliedToDrive = (driveId: number): boolean => {
    return Boolean(getApplicationForDrive(driveId));
  };

  return {
    ...query,
    applications,
    getApplicationForDrive,
    hasAppliedToDrive,
  };
}
