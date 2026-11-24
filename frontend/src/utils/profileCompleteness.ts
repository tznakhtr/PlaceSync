import type { StudentProfile } from '../types/student';

export interface CompletenessItem {
  key: string;
  label: string;
  done: boolean;
  requiredForEligibility: boolean;
}

export interface ProfileCompletenessResult {
  percent: number;
  items: CompletenessItem[];
}

/**
 * Calculates student profile completeness percentage across 8 weighted criteria (12.5% each).
 * Identifies eligibility-critical fields vs recommended additions.
 */
export function getProfileCompleteness(
  profile: StudentProfile | null | undefined,
): ProfileCompletenessResult {
  const items: CompletenessItem[] = [
    {
      key: 'rollNo',
      label: 'Roll number',
      done: Boolean(profile?.rollNo && profile.rollNo.trim().length > 0),
      requiredForEligibility: true,
    },
    {
      key: 'branch',
      label: 'Branch',
      done: Boolean(profile?.branch && profile.branch.trim().length > 0),
      requiredForEligibility: true,
    },
    {
      key: 'cgpa',
      label: 'CGPA',
      done: typeof profile?.cgpa === 'number' && !isNaN(profile.cgpa) && profile.cgpa > 0,
      requiredForEligibility: true,
    },
    {
      key: 'activeBacklogs',
      label: 'Active backlogs',
      // Counts as filled when it is any valid number, including 0
      done:
        typeof profile?.activeBacklogs === 'number' &&
        !isNaN(profile.activeBacklogs) &&
        profile.activeBacklogs >= 0,
      requiredForEligibility: true,
    },
    {
      key: 'graduationYear',
      label: 'Graduation year',
      done:
        typeof profile?.graduationYear === 'number' &&
        !isNaN(profile.graduationYear) &&
        profile.graduationYear > 0,
      requiredForEligibility: true,
    },
    {
      key: 'skills',
      label: 'At least one skill',
      done: Array.isArray(profile?.skills) && profile.skills.length > 0,
      requiredForEligibility: false,
    },
    {
      key: 'phone',
      label: 'Phone number',
      done: Boolean(profile?.phone && profile.phone.trim().length > 0),
      requiredForEligibility: false,
    },
    {
      key: 'resumeUrl',
      label: 'Resume',
      done: Boolean(profile?.resumeUrl && profile.resumeUrl.trim().length > 0),
      requiredForEligibility: false,
    },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return { percent, items };
}
