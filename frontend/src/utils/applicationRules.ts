import type { Application } from '../types/application';

/**
 * Frontend rule check for showing the Withdraw application action:
 * Permitted only if:
 * 1. Application status is strictly "APPLIED"
 * 2. Drive status is "OPEN"
 * 3. Drive deadline has not passed (in the future)
 *
 * Note: The backend enforces the definitive verification.
 */
export function canWithdraw(application: Application | null | undefined): boolean {
  if (!application || !application.drive) return false;

  const isAppliedStatus = application.status === 'APPLIED';
  const isDriveOpen = application.drive.status === 'OPEN';
  const isBeforeDeadline = new Date(application.drive.deadline).getTime() > Date.now();

  return isAppliedStatus && isDriveOpen && isBeforeDeadline;
}
