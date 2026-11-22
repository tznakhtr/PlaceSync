import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

interface RequestWithUser extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * Controller for in-app user notifications.
 * Accessible by any authenticated user (STUDENT or CELL), strictly scoped to req.user.id.
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Retrieve paginated notifications for the authenticated user.
   */
  @Get()
  async getUserNotifications(
    @Request() req: RequestWithUser,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, query);
  }

  /**
   * GET /notifications/unread-count
   * Return number of unread notifications for the user.
   * Placed before :id to prevent path collision.
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: RequestWithUser) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  /**
   * PATCH /notifications/read-all
   * Mark all of the authenticated user's notifications as read.
   * Placed before :id to prevent path collision.
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a specific notification as read.
   * Returns 404 if not found or belongs to another user.
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }
}
