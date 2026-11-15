import { Module } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';

/**
 * EligibilityModule encapsulates placement eligibility evaluation logic
 * and exports EligibilityService for use in Drives, Applications, etc.
 */
@Module({
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}
