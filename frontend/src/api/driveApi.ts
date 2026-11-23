import apiClient from './axios';
import { getBranches as getStudentBranches } from './studentApi';
import type { Drive, DriveListResponse, DrivePayload, DriveQueryParams } from '../types/drive';

/**
 * Fetch paginated list of placement drives with optional status, search, and eligibleOnly filters.
 * GET /drives
 */
export const getDrives = async (params: DriveQueryParams = {}): Promise<DriveListResponse> => {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.status) {
    queryParams.status = params.status;
  }
  if (params.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params.page !== undefined && params.page > 0) {
    queryParams.page = params.page;
  }
  if (params.limit !== undefined && params.limit > 0) {
    queryParams.limit = params.limit;
  }
  if (params.eligibleOnly) {
    queryParams.eligibleOnly = true;
  }

  const response = await apiClient.get<DriveListResponse>('/drives', {
    params: queryParams,
  });
  return response.data;
};

/**
 * Fetch details of a single placement drive by ID.
 * GET /drives/:id
 */
export const getDrive = async (id: number): Promise<Drive> => {
  const response = await apiClient.get<Drive>(`/drives/${id}`);
  return response.data;
};

/**
 * Create a new placement drive (Placement Cell only).
 * POST /drives
 */
export const createDrive = async (payload: DrivePayload): Promise<Drive> => {
  const response = await apiClient.post<Drive>('/drives', payload);
  return response.data;
};

/**
 * Update an existing placement drive (Placement Cell only).
 * PUT /drives/:id
 */
export const updateDrive = async (id: number, payload: DrivePayload): Promise<Drive> => {
  const response = await apiClient.put<Drive>(`/drives/${id}`, payload);
  return response.data;
};

/**
 * Update the status of a placement drive between OPEN and CLOSED (Placement Cell only).
 * PATCH /drives/:id/status
 */
export const updateDriveStatus = async (
  id: number,
  status: 'OPEN' | 'CLOSED',
): Promise<Drive> => {
  const response = await apiClient.patch<Drive>(`/drives/${id}/status`, { status });
  return response.data;
};

/**
 * Delete a placement drive (Placement Cell only).
 * Throws 409 if applications exist.
 * DELETE /drives/:id
 */
export const deleteDrive = async (id: number): Promise<void> => {
  await apiClient.delete(`/drives/${id}`);
};

/**
 * Re-export getBranches for Placement Cell forms.
 */
export const getBranches = getStudentBranches;
