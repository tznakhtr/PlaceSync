import type { DriveStatus } from './drive';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'REJECTED'
  | 'UNDER_REVIEW';

export interface ApplicationDrive {
  id: number;
  companyName: string;
  role: string;
  packageLpa: number;
  location: string | null;
  deadline: string;
  status: DriveStatus;
}

export interface Application {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  drive: ApplicationDrive;
}

export interface AppliedResponse {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  drive: {
    id: number;
    companyName: string;
    role: string;
    deadline: string;
  };
}

export interface QueryApplicationsParams {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
}

export interface ApplicationListResponse {
  data: Application[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Detailed profile structure for an applicant.
 */
export interface ApplicantStudentProfile {
  rollNo: string;
  branch: string;
  cgpa: number;
  activeBacklogs: number;
  graduationYear: number;
  skills: string[];
  phone: string | null;
  resumeUrl: string | null;
}

/**
 * Student summary attached to an applicant record.
 */
export interface ApplicantStudent {
  id: number;
  name: string;
  email: string;
  profile: ApplicantStudentProfile | null;
}

/**
 * Applicant record returned by GET /drives/:id/applications (Placement Cell).
 */
export interface DriveApplicant {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  student: ApplicantStudent;
}

/**
 * Summary metrics of applications for a drive returned by GET /drives/:id/applications/summary.
 */
export interface DriveApplicationsSummary {
  total: number;
  APPLIED: number;
  SHORTLISTED: number;
  INTERVIEW: number;
  SELECTED: number;
  REJECTED: number;
}

/**
 * Query parameters for filtering, sorting, and paginating applicants in GET /drives/:id/applications.
 */
export interface QueryDriveApplicantsParams {
  status?: ApplicationStatus;
  branch?: string;
  minCgpa?: number;
  search?: string;
  sortBy?: 'cgpa' | 'appliedAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Paginated applicants response returned by GET /drives/:id/applications.
 */
export interface DriveApplicantsResponse {
  data: DriveApplicant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Payload for bulk status update in PATCH /drives/:id/applications/status.
 */
export interface BulkUpdateApplicationsStatusPayload {
  applicationIds: number[];
  status: ApplicationStatus;
}

/**
 * Response returned from successful PATCH /drives/:id/applications/status.
 */
export interface BulkUpdateApplicationsStatusResponse {
  updated: number;
}

/**
 * Structure of individual failure items when bulk update fails.
 */
export interface BulkUpdateFailure {
  applicationId: number;
  reason: string;
}
