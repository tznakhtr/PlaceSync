import { ApplicationStatus } from '@prisma/client';

/**
 * Valid state transitions for applications in PlaceSync:
 * - APPLIED     -> SHORTLISTED, REJECTED
 * - SHORTLISTED -> INTERVIEW, REJECTED
 * - INTERVIEW   -> SELECTED, REJECTED
 * - SELECTED    -> none (terminal)
 * - REJECTED    -> none (terminal)
 */
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  [ApplicationStatus.APPLIED]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.INTERVIEW]: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.SELECTED]: [],
  [ApplicationStatus.REJECTED]: [],
};

/**
 * Pure function that determines if an application status transition is allowed.
 * Reused across all status updating endpoints.
 */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (!from || !to) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
