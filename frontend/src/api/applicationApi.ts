import apiClient from './axios';
import type {
  ApplicationListResponse,
  AppliedResponse,
  QueryApplicationsParams,
} from '../types/application';

/**
 * Submit student application to a placement drive.
 * POST /drives/:id/apply
 */
export const applyToDrive = async (driveId: number): Promise<AppliedResponse> => {
  const response = await apiClient.post<AppliedResponse>(`/drives/${driveId}/apply`);
  return response.data;
};

/**
 * Retrieve logged-in student's applications, sorted newest first.
 * GET /applications/me
 */
export const getMyApplications = async (
  params: QueryApplicationsParams = {},
): Promise<ApplicationListResponse> => {
  const queryParams: Record<string, string | number> = {};

  if (params.status) {
    queryParams.status = params.status;
  }
  if (params.page !== undefined && params.page > 0) {
    queryParams.page = params.page;
  }
  if (params.limit !== undefined && params.limit > 0) {
    queryParams.limit = params.limit;
  }

  const response = await apiClient.get<ApplicationListResponse>('/applications/me', {
    params: queryParams,
  });
  return response.data;
};

/**
 * Withdraw an application before deadline while still in APPLIED status.
 * DELETE /applications/:id
 */
export const withdrawApplication = async (
  applicationId: number,
): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/applications/${applicationId}`,
  );
  return response.data;
};
