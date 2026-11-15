import { ApplicationStatus } from '@prisma/client';
import { canTransition } from './application-status';

describe('canTransition', () => {
  describe('Allowed transitions', () => {
    it('should allow APPLIED -> SHORTLISTED', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED)).toBe(true);
    });

    it('should allow APPLIED -> REJECTED', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.REJECTED)).toBe(true);
    });

    it('should allow SHORTLISTED -> INTERVIEW', () => {
      expect(canTransition(ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW)).toBe(true);
    });

    it('should allow SHORTLISTED -> REJECTED', () => {
      expect(canTransition(ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED)).toBe(true);
    });

    it('should allow INTERVIEW -> SELECTED', () => {
      expect(canTransition(ApplicationStatus.INTERVIEW, ApplicationStatus.SELECTED)).toBe(true);
    });

    it('should allow INTERVIEW -> REJECTED', () => {
      expect(canTransition(ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED)).toBe(true);
    });
  });

  describe('Invalid transitions', () => {
    it('should disallow skipping steps: APPLIED -> INTERVIEW or SELECTED', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW)).toBe(false);
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.SELECTED)).toBe(false);
    });

    it('should disallow skipping steps: SHORTLISTED -> SELECTED', () => {
      expect(canTransition(ApplicationStatus.SHORTLISTED, ApplicationStatus.SELECTED)).toBe(false);
    });

    it('should disallow backwards moves: SHORTLISTED -> APPLIED', () => {
      expect(canTransition(ApplicationStatus.SHORTLISTED, ApplicationStatus.APPLIED)).toBe(false);
    });

    it('should disallow backwards moves: INTERVIEW -> APPLIED or SHORTLISTED', () => {
      expect(canTransition(ApplicationStatus.INTERVIEW, ApplicationStatus.APPLIED)).toBe(false);
      expect(canTransition(ApplicationStatus.INTERVIEW, ApplicationStatus.SHORTLISTED)).toBe(false);
    });

    it('should disallow any transition from final status: SELECTED', () => {
      expect(canTransition(ApplicationStatus.SELECTED, ApplicationStatus.APPLIED)).toBe(false);
      expect(canTransition(ApplicationStatus.SELECTED, ApplicationStatus.SHORTLISTED)).toBe(false);
      expect(canTransition(ApplicationStatus.SELECTED, ApplicationStatus.INTERVIEW)).toBe(false);
      expect(canTransition(ApplicationStatus.SELECTED, ApplicationStatus.REJECTED)).toBe(false);
      expect(canTransition(ApplicationStatus.SELECTED, ApplicationStatus.SELECTED)).toBe(false);
    });

    it('should disallow any transition from final status: REJECTED', () => {
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.APPLIED)).toBe(false);
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.SHORTLISTED)).toBe(false);
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.INTERVIEW)).toBe(false);
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.SELECTED)).toBe(false);
      expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.REJECTED)).toBe(false);
    });

    it('should disallow transitions to same status: APPLIED -> APPLIED', () => {
      expect(canTransition(ApplicationStatus.APPLIED, ApplicationStatus.APPLIED)).toBe(false);
    });
  });
});
