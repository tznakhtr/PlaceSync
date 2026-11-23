/**
 * PlaceSync user roles.
 * Must match backend Role enum.
 */
export type Role = 'STUDENT' | 'CELL';

/**
 * User object returned from authentication endpoints.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/**
 * Drive recruitment and application statuses.
 */
export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'REJECTED'
  | 'UNDER_REVIEW';

/**
 * Authentication response from POST /auth/login.
 */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * Registration response from POST /auth/register.
 */
export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export * from './student';
export * from './drive';
