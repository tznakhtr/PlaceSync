import apiClient from './axios';
import type { AuthResponse, RegisterResponse, User } from '../types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Authenticate user with email and password.
   */
  async login(payload: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  /**
   * Register a new student account.
   * Role is never sent from frontend.
   */
  async register(payload: RegisterDto): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return response.data;
  },

  /**
   * Restore user profile using current Bearer token.
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
