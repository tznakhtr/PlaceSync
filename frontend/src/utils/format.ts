/**
 * Formatting helpers for PlaceSync.
 * Uses en-IN locale and currency/number standards.
 */

/**
 * Format LPA package numbers (e.g. 6.5 -> "₹6.5 LPA", 10 -> "₹10 LPA").
 */
export function formatLpa(packageLpa: number): string {
  if (typeof packageLpa !== 'number' || isNaN(packageLpa)) {
    return '₹0 LPA';
  }
  const formatted =
    packageLpa % 1 === 0
      ? packageLpa.toString()
      : packageLpa.toFixed(2).replace(/\.?0+$/, '');
  return `₹${formatted} LPA`;
}

/**
 * Format ISO datetime into readable en-IN format (e.g. "25 Nov 2026, 5:00 pm").
 */
export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export interface DeadlineInfo {
  text: string;
  isPast: boolean;
  isSoon: boolean;
}

/**
 * Calculates deadline status text and urgency flags:
 * - isPast: deadline has passed
 * - isSoon: under 48 hours remaining
 * Examples: "Closes today", "Closes tomorrow", "Closes in 3 days", "Deadline passed"
 */
export function getDeadlineInfo(iso: string | Date): DeadlineInfo {
  const target = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(target.getTime())) {
    return { text: 'Invalid date', isPast: false, isSoon: false };
  }

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      text: 'Deadline passed',
      isPast: true,
      isSoon: false,
    };
  }

  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 48) {
    const text = diffHours < 24 ? 'Closes today' : 'Closes tomorrow';
    return {
      text,
      isPast: false,
      isSoon: true,
    };
  }

  return {
    text: `Closes in ${diffDays} days`,
    isPast: false,
    isSoon: false,
  };
}

/**
 * Convert an ISO string or Date to format required by <input type="datetime-local" /> in local time.
 * Returns format: "YYYY-MM-DDTHH:mm"
 */
export function toLocalInputValue(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Build a human-readable eligibility preview sentence from form values.
 * e.g. "CSE and IT students of the 2028 batch with CGPA 7.5 or above and at most 0 active backlogs."
 */
export function describeEligibility(values: {
  allowedBranches?: string[];
  graduationYear?: number;
  minCgpa?: number;
  maxBacklogs?: number;
}): string {
  const branches = values.allowedBranches && values.allowedBranches.length > 0 ? (
    values.allowedBranches.length === 1
      ? `${values.allowedBranches[0]} students`
      : values.allowedBranches.length === 2
      ? `${values.allowedBranches[0]} and ${values.allowedBranches[1]} students`
      : `${values.allowedBranches.slice(0, -1).join(', ')}, and ${values.allowedBranches[values.allowedBranches.length - 1]} students`
  ) : 'Students of all allowed branches';

  const batch = values.graduationYear ? ` of the ${values.graduationYear} batch` : '';
  const cgpa =
    typeof values.minCgpa === 'number' && values.minCgpa > 0
      ? ` with CGPA ${values.minCgpa.toFixed(2).replace(/\.?0+$/, '')} or above`
      : ' with any CGPA';
  const backlogs =
    typeof values.maxBacklogs === 'number'
      ? ` and at most ${values.maxBacklogs} active ${values.maxBacklogs === 1 ? 'backlog' : 'backlogs'}.`
      : '.';

  return `${branches}${batch}${cgpa}${backlogs}`;
}
