/**
 * Type definitions for recruitment drive results and publishing operations.
 */

export interface PublishResponse {
  driveId: number;
  status: 'COMPLETED';
  selected: number;
  rejected: number;
  total: number;
}

export interface SelectedStudentProfile {
  rollNo: string;
  branch: string;
  cgpa: number;
}

export interface SelectedStudent {
  student: {
    id: number;
    name: string;
    email: string;
    profile: SelectedStudentProfile | null;
  };
}

export interface DriveResults {
  drive: {
    id: number;
    companyName: string;
    role: string;
    status: string;
  };
  selected: SelectedStudent[];
}
