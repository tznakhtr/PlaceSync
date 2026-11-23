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
