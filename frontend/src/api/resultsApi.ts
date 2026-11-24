import apiClient from './axios';
import type { DriveResults, PublishResponse } from '../types/results';

/**
 * Publish final hiring results for a placement drive (Placement Cell).
 * Sets drive status to COMPLETED and optionally rejects pending applications.
 * POST /drives/:id/publish-results
 */
export const publishResults = async (
  driveId: number,
  autoRejectPending: boolean = false,
): Promise<PublishResponse> => {
  const response = await apiClient.post<PublishResponse>(
    `/drives/${driveId}/publish-results`,
    { autoRejectPending },
  );
  return response.data;
};

/**
 * Retrieve final list of selected candidates for a completed placement drive (Placement Cell).
 * GET /drives/:id/results
 */
export const getResults = async (driveId: number): Promise<DriveResults> => {
  const response = await apiClient.get<DriveResults>(`/drives/${driveId}/results`);
  return response.data;
};
