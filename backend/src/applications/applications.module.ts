import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

/**
 * ApplicationsModule manages job application submissions, tracking, and withdrawals.
 * Imports EligibilityModule to reuse EligibilityService.
 */
@Module({
  imports: [EligibilityModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
