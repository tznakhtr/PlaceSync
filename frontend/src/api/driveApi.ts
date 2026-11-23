import apiClient from './axios';
import type { Drive, DriveListResponse, DriveQueryParams } from '../types/drive';

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
