import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationType } from './notification-type';

/**
 * Service managing in-app notifications.
 * Supports transactional creation so notifications commit or roll back with business logic.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a single notification for a user.
   * If an optional transaction client (tx) is passed, executes within that transaction.
   */
  async createFor(
    userId: number,
    type: NotificationType,
    message: string,
    driveId?: number | null,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.notification.create({
      data: {
        userId,
        type,
        message,
        driveId: driveId ?? null,
        isRead: false,
      },
    });
  }

  /**
   * Create notifications for multiple users in a single batch query (createMany).
   * If an optional transaction client (tx) is passed, executes within that transaction.
   */
  async createManyFor(
    userIds: number[],
    type: NotificationType,
    message: string,
    driveId?: number | null,
    tx?: Prisma.TransactionClient,
  ) {
    if (!userIds || userIds.length === 0) {
      return { count: 0 };
    }

    const client = tx || this.prisma;
    const data = userIds.map((userId) => ({
      userId,
      type,
      message,
      driveId: driveId ?? null,
      isRead: false,
    }));

    return client.notification.createMany({
      data,
    });
  }

  /**
   * Retrieve paginated notifications for the logged-in user, newest first.
   */
  async getUserNotifications(userId: number, query: QueryNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          message: true,
          driveId: true,
          isRead: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Return the count of unread notifications for the user.
   */
  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }

  /**
   * Mark a single notification as read.
   * Throws 404 if it does not exist or belongs to another user.
   */
  async markAsRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: {
        id: true,
        type: true,
        message: true,
        driveId: true,
        isRead: true,
        createdAt: true,
      },
    });

    return updated;
  }

  /**
   * Mark all notifications belonging to the user as read.
   */
  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { updated: result.count };
  }
}
