import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator attaches allowed roles to route handlers or controllers.
 * Usage: @Roles(Role.STUDENT) or @Roles(Role.CELL)
 * Evaluated by RolesGuard to enforce Role-Based Access Control (RBAC).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
