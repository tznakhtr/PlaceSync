import apiClient from './axios';
import type {
  ApplicationListResponse,
  AppliedResponse,
  BulkUpdateApplicationsStatusPayload,
  BulkUpdateApplicationsStatusResponse,
  DriveApplicant,
  DriveApplicantsResponse,
  DriveApplicationsSummary,
  QueryApplicationsParams,
  QueryDriveApplicantsParams,
  ApplicationStatus,
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

/**
 * Retrieve applicants for a specific placement drive with filtering, sorting, and pagination (Placement Cell).
 * GET /drives/:id/applications
 */
export const getDriveApplications = async (
  driveId: number,
  params: QueryDriveApplicantsParams = {},
): Promise<DriveApplicantsResponse> => {
  const queryParams: Record<string, string | number> = {};

  if (params.status) {
    queryParams.status = params.status;
  }
  if (params.branch) {
    queryParams.branch = params.branch;
  }
  if (params.minCgpa !== undefined && !isNaN(params.minCgpa)) {
    queryParams.minCgpa = params.minCgpa;
  }
  if (params.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }
  if (params.sortBy) {
    queryParams.sortBy = params.sortBy;
  }
  if (params.order) {
    queryParams.order = params.order;
  }
  if (params.page !== undefined && params.page > 0) {
    queryParams.page = params.page;
  }
  if (params.limit !== undefined && params.limit > 0) {
    queryParams.limit = params.limit;
  }

  const response = await apiClient.get<DriveApplicantsResponse>(
    `/drives/${driveId}/applications`,
    { params: queryParams },
  );
  return response.data;
};

/**
 * Group drive applications by status count (Placement Cell).
 * GET /drives/:id/applications/summary
 */
export const getDriveApplicationsSummary = async (
  driveId: number,
): Promise<DriveApplicationsSummary> => {
  const response = await apiClient.get<DriveApplicationsSummary>(
    `/drives/${driveId}/applications/summary`,
  );
  return response.data;
};

/**
 * Update the status of an individual applicant (Placement Cell).
 * PATCH /applications/:id/status
 */
export const updateApplicationStatus = async (
  applicationId: number,
  status: ApplicationStatus,
): Promise<DriveApplicant> => {
  const response = await apiClient.patch<DriveApplicant>(
    `/applications/${applicationId}/status`,
    { status },
  );
  return response.data;
};

/**
 * Bulk update statuses for multiple applications in an atomic transaction (Placement Cell).
 * PATCH /drives/:id/applications/status
 */
export const bulkUpdateApplicationsStatus = async (
  driveId: number,
  payload: BulkUpdateApplicationsStatusPayload,
): Promise<BulkUpdateApplicationsStatusResponse> => {
  const response = await apiClient.patch<BulkUpdateApplicationsStatusResponse>(
    `/drives/${driveId}/applications/status`,
    payload,
  );
  return response.data;
};
