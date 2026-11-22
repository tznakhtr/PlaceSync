import { DriveStatus } from '@prisma/client';
import {
  DriveLike,
  EligibilityService,
  StudentProfileLike,
} from './eligibility.service';

describe('EligibilityService', () => {
  let service: EligibilityService;

  // Base drive template with open status and future deadline
  const baseDrive: DriveLike = {
    status: DriveStatus.OPEN,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
    minCgpa: 7.5,
    allowedBranches: ['CSE', 'IT'],
    maxBacklogs: 0,
    graduationYear: 2026,
  };

  // Base eligible student profile
  const baseProfile: StudentProfileLike = {
    branch: 'CSE',
    cgpa: 8.5,
    activeBacklogs: 0,
    graduationYear: 2026,
  };

  beforeEach(() => {
    service = new EligibilityService();
  });

  it('should return eligible: true when student meets all criteria', () => {
    const result = service.checkEligibility(baseProfile, baseDrive);
    expect(result).toEqual({
      eligible: true,
      reasons: [],
    });
  });

  it('should return eligible: false and prompt to complete profile when profile is null', () => {
    const result = service.checkEligibility(null, baseDrive);
    expect(result).toEqual({
      eligible: false,
      reasons: ['Complete your profile to check eligibility'],
    });
  });

  it('should fail when drive status is CLOSED', () => {
    const closedDrive: DriveLike = {
      ...baseDrive,
      status: DriveStatus.CLOSED,
    };
    const result = service.checkEligibility(baseProfile, closedDrive);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('This drive is not open for applications');
  });

  it('should fail when application deadline has passed', () => {
    const expiredDrive: DriveLike = {
      ...baseDrive,
      deadline: new Date(Date.now() - 1000), // 1 second in past
    };
    const result = service.checkEligibility(baseProfile, expiredDrive);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('The application deadline has passed');
  });

  it('should fail when student CGPA is lower than required minimum CGPA', () => {
    const lowCgpaProfile: StudentProfileLike = {
      ...baseProfile,
      cgpa: 7.0,
    };
    const result = service.checkEligibility(lowCgpaProfile, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('Minimum CGPA required is 7.5, yours is 7');
  });

  it('should fail when student branch is not in allowed branches', () => {
    const wrongBranchProfile: StudentProfileLike = {
      ...baseProfile,
      branch: 'ME',
    };
    const result = service.checkEligibility(wrongBranchProfile, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      'Your branch (ME) is not eligible. Allowed: CSE, IT',
    );
  });

  it('should fail when student has more active backlogs than allowed', () => {
    const backlogsProfile: StudentProfileLike = {
      ...baseProfile,
      activeBacklogs: 2,
    };
    const result = service.checkEligibility(backlogsProfile, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain(
      'Maximum 0 active backlogs allowed, you have 2',
    );
  });

  it('should fail when student graduation year does not match drive batch', () => {
    const wrongYearProfile: StudentProfileLike = {
      ...baseProfile,
      graduationYear: 2025,
    };
    const result = service.checkEligibility(wrongYearProfile, baseDrive);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain('This drive is for the 2026 batch');
  });

  it('should collect every failed rule simultaneously when multiple conditions fail', () => {
    const invalidProfile: StudentProfileLike = {
      branch: 'CE',
      cgpa: 6.0,
      activeBacklogs: 3,
      graduationYear: 2024,
    };

    const invalidDrive: DriveLike = {
      status: DriveStatus.COMPLETED,
      deadline: new Date(Date.now() - 3600000), // 1 hour ago
      minCgpa: 8.0,
      allowedBranches: ['CSE', 'IT'],
      maxBacklogs: 1,
      graduationYear: 2026,
    };

    const result = service.checkEligibility(invalidProfile, invalidDrive);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(6);
    expect(result.reasons).toEqual([
      'This drive is not open for applications',
      'The application deadline has passed',
      'Minimum CGPA required is 8, yours is 6',
      'Your branch (CE) is not eligible. Allowed: CSE, IT',
      'Maximum 1 active backlogs allowed, you have 3',
      'This drive is for the 2026 batch',
    ]);
  });
});
