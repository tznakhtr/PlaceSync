import { Injectable } from '@nestjs/common';
import { DriveStatus } from '@prisma/client';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export interface StudentProfileLike {
  branch: string;
  cgpa: number;
  activeBacklogs: number;
  graduationYear: number;
}

export interface DriveLike {
  status: DriveStatus;
  deadline: Date | string;
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  graduationYear: number;
}

/**
 * EligibilityService serves as the single source of truth for evaluation rules.
 * Pure business logic without any side-effects or database queries.
 */
@Injectable()
export class EligibilityService {
  /**
   * Evaluates student profile against drive requirements.
   * Collects every failed condition rather than returning on the first failure.
   */
  checkEligibility(
    profile: StudentProfileLike | null | undefined,
    drive: DriveLike,
  ): EligibilityResult {
    // If student has not created a profile yet
    if (!profile) {
      return {
        eligible: false,
        reasons: ['Complete your profile to check eligibility'],
      };
    }

    const reasons: string[] = [];

    // Rule a: Drive status must be OPEN
    if (drive.status !== DriveStatus.OPEN) {
      reasons.push('This drive is not open for applications');
    }

    // Rule b: Current time must be before drive deadline
    const deadlineTime = new Date(drive.deadline).getTime();
    if (Date.now() >= deadlineTime) {
      reasons.push('The application deadline has passed');
    }

    // Rule c: Profile CGPA must meet or exceed drive minCgpa
    if (profile.cgpa < drive.minCgpa) {
      reasons.push(`Minimum CGPA required is ${drive.minCgpa}, yours is ${profile.cgpa}`);
    }

    // Rule d: Profile branch must be included in allowedBranches
    if (!drive.allowedBranches.includes(profile.branch)) {
      reasons.push(
        `Your branch (${profile.branch}) is not eligible. Allowed: ${drive.allowedBranches.join(', ')}`,
      );
    }

    // Rule e: Active backlogs must not exceed maxBacklogs
    if (profile.activeBacklogs > drive.maxBacklogs) {
      reasons.push(
        `Maximum ${drive.maxBacklogs} active backlogs allowed, you have ${profile.activeBacklogs}`,
      );
    }

    // Rule f: Graduation year must match drive graduation batch
    if (profile.graduationYear !== drive.graduationYear) {
      reasons.push(`This drive is for the ${drive.graduationYear} batch`);
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }
}
