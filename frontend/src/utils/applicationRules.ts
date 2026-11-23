import type { Application, ApplicationStatus } from '../types/application';

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

/**
 * Returns allowed next statuses for an application based on placement cell transition workflow rules:
 * APPLIED     -> SHORTLISTED, REJECTED
 * SHORTLISTED -> INTERVIEW, REJECTED
 * INTERVIEW   -> SELECTED, REJECTED
 * SELECTED, REJECTED -> none (terminal states)
 */
export function getAllowedNextStatuses(status: ApplicationStatus | string): ApplicationStatus[] {
  switch (status) {
    case 'APPLIED':
      return ['SHORTLISTED', 'REJECTED'];
    case 'SHORTLISTED':
      return ['INTERVIEW', 'REJECTED'];
    case 'INTERVIEW':
      return ['SELECTED', 'REJECTED'];
    case 'SELECTED':
    case 'REJECTED':
    default:
      return [];
  }
}

/**
 * Returns the human-readable action button label for advancing an applicant to a target status:
 * SHORTLISTED -> "Shortlist"
 * INTERVIEW   -> "Move to interview"
 * SELECTED    -> "Select"
 * REJECTED    -> "Reject"
 */
export function getStatusActionLabel(status: ApplicationStatus | string): string {
  switch (status) {
    case 'SHORTLISTED':
      return 'Shortlist';
    case 'INTERVIEW':
      return 'Move to interview';
    case 'SELECTED':
      return 'Select';
    case 'REJECTED':
      return 'Reject';
    default:
      return status;
  }
}

/**
 * Helper to check whether an application can transition from one status to another.
 */
export function canTransition(
  fromStatus: ApplicationStatus | string,
  toStatus: ApplicationStatus | string,
): boolean {
  return (getAllowedNextStatuses(fromStatus) as string[]).includes(toStatus);
}
