export type DriveStatus = 'OPEN' | 'CLOSED' | 'COMPLETED';

export interface Eligibility {
  eligible: boolean;
  reasons: string[];
}

export interface Drive {
  id: number;
  companyName: string;
  role: string;
  description: string;
  packageLpa: number;
  location: string | null;
  requiredSkills: string[];
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  graduationYear: number;
  deadline: string;
  status: DriveStatus;
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
  };
  eligibility?: Eligibility;
  applicationsCount?: number;
}

export interface DrivePayload {
  companyName: string;
  role: string;
  description: string;
  packageLpa: number;
  location?: string;
  requiredSkills: string[];
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  graduationYear: number;
  deadline: string;
}

export interface DriveQueryParams {
  status?: DriveStatus;
  search?: string;
  page?: number;
  limit?: number;
  eligibleOnly?: boolean;
}

export interface DriveListResponse {
  data: Drive[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
