/**
 * Standard list of engineering branches supported in PlaceSync.
 * Shared between Student Profile and Placement Drives modules.
 */
export const ALLOWED_BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE'] as const;

export type Branch = (typeof ALLOWED_BRANCHES)[number];
