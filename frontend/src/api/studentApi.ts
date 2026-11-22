import apiClient from './axios';
import type {
  GetProfileResponse,
  ProfilePayload,
  StudentProfile,
  UploadResumeResponse,
} from '../types/student';

/**
 * Fetch the logged-in student's profile and completeness status.
 * GET /students/me
 */
export const getStudentProfile = async (): Promise<GetProfileResponse> => {
  const response = await apiClient.get<GetProfileResponse>('/students/me');
  return response.data;
};

/**
 * Create or update the logged-in student's academic profile.
 * PUT /students/me
 */
export const updateStudentProfile = async (payload: ProfilePayload): Promise<StudentProfile> => {
  const response = await apiClient.put<StudentProfile>('/students/me', payload);
  return response.data;
};

/**
 * Fetch list of allowed engineering branches for dropdown.
 * Handles both plain string array and object containing branches array.
 * GET /students/branches
 */
export const getBranches = async (): Promise<string[]> => {
  const response = await apiClient.get<string[] | { branches?: string[] } | Record<string, unknown>>(
    '/students/branches',
  );
  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if ('branches' in data && Array.isArray((data as { branches?: unknown }).branches)) {
      return (data as { branches: string[] }).branches;
    }
    const foundArray = Object.values(data).find(Array.isArray);
    if (foundArray) {
      return foundArray as string[];
    }
  }
  return [];
};

/**
 * Upload student resume PDF (max 2 MB).
 * POST /students/me/resume
 * Sends FormData with field name "resume". Does not set Content-Type header manually.
 */
export const uploadResume = async (file: File): Promise<UploadResumeResponse> => {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await apiClient.post<UploadResumeResponse>('/students/me/resume', formData, {
    headers: {
      // Allow browser to calculate boundary for multipart/form-data
      'Content-Type': undefined,
    },
  });
  return response.data;
};

/**
 * Delete student resume.
 * DELETE /students/me/resume
 */
export const deleteResume = async (): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>('/students/me/resume');
  return response.data;
};
