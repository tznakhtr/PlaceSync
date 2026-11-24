import type { Application, ApplicationStatus } from '../types/application';

export type ApplicationStatusCounts = Record<ApplicationStatus, number>;

/**
 * Computes frequency counts for all application recruitment stages.
 */
export function countByStatus(applications: Application[]): ApplicationStatusCounts {
  const counts: ApplicationStatusCounts = {
    APPLIED: 0,
    SHORTLISTED: 0,
    INTERVIEW: 0,
    SELECTED: 0,
    REJECTED: 0,
    UNDER_REVIEW: 0,
  };

  for (const app of applications) {
    if (app && app.status && app.status in counts) {
      counts[app.status]++;
    }
  }

  return counts;
}

/**
 * Checks if a drive deadline is in the future and closing within `days` days (e.g. 7 days).
 */
export function isClosingWithinDays(deadline: string | Date, days: number = 7): boolean {
  const target = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(target.getTime())) return false;

  const diffMs = target.getTime() - Date.now();
  const maxMs = days * 24 * 60 * 60 * 1000;

  return diffMs > 0 && diffMs <= maxMs;
}
