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
