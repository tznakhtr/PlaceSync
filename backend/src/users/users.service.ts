import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * UsersService handles database queries for the User model.
 * Authentication logic (hashing, comparing, JWT tokens) is kept separately in AuthService.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by email (case-insensitive and trimmed).
   * Used during registration check and login password verification.
   */
  async findByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
  }

  /**
   * Find a user by ID without returning sensitive passwordHash.
   * Used for fetching the authenticated user (e.g., GET /auth/me).
   */
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Create a new student user in the database.
   * The role is strictly hardcoded to Role.STUDENT to ensure safety.
   */
  async createStudent(data: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        role: Role.STUDENT, // Role is always STUDENT; never from client request
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }
}

