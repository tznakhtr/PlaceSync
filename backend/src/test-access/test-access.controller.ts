import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

/**
 * TEMPORARY, delete after testing.
 * Controller created to verify Role-Based Access Control (RBAC).
 */
@Controller('test-access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestAccessController {
  /**
   * GET /test-access/student
   * Only accessible by users with the STUDENT role.
   */
  @Get('student')
  @Roles(Role.STUDENT)
  getStudentAccess() {
    return { message: 'Student access OK' };
  }

  /**
   * GET /test-access/cell
   * Only accessible by users with the CELL role (Placement Cell).
   */
  @Get('cell')
  @Roles(Role.CELL)
  getCellAccess() {
    return { message: 'Cell access OK' };
  }

  /**
   * GET /test-access/any
   * Accessible by any authenticated user (STUDENT or CELL).
   * Since no @Roles() decorator is defined, RolesGuard permits access.
   */
  @Get('any')
  getAnyAccess() {
    return { message: 'Any logged-in user OK' };
  }
}
