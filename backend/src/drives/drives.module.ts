import { Module } from '@nestjs/common';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DrivesController } from './drives.controller';
import { DrivesService } from './drives.service';

@Module({
  imports: [EligibilityModule, NotificationsModule],
  controllers: [DrivesController],
  providers: [DrivesService],
  exports: [DrivesService],
})
export class DrivesModule {}
