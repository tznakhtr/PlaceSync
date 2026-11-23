/**
 * Student profile types for PlaceSync.
 * Corresponds to student profile backend endpoints.
 */

export interface StudentProfile {
  id?: number;
  userId?: number;
  rollNo: string;
  branch: string;
  cgpa: number;
  activeBacklogs: number;
  graduationYear: number;
  skills: string[];
  phone: string | null;
  resumeUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfilePayload {
  rollNo: string;
  branch: string;
  cgpa: number;
  activeBacklogs: number;
  graduationYear: number;
  skills: string[];
  phone?: string;
}

export interface GetProfileResponse {
  profile: StudentProfile | null;
  isComplete: boolean;
}

export interface UploadResumeResponse {
  resumeUrl: string;
}
