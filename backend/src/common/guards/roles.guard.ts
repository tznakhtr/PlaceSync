import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard enforces Role-Based Access Control (RBAC).
 * - Reads required roles attached by @Roles() (handler first, then class).
 * - If no @Roles() is specified on the route, access is allowed.
 * - Inspects request.user (attached by JwtStrategy) to verify user.role.
 * - Throws ForbiddenException if the user lacks the required role.
 * - Must run AFTER JwtAuthGuard: @UseGuards(JwtAuthGuard, RolesGuard).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read required roles from route metadata (method level first, then class level)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Retrieve the authenticated user from the HTTP request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Deny access if user object is missing, has no role, or role is not allowed
    if (!user || !user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
