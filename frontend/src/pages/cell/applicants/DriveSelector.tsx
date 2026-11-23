import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { getDrives } from '../../../api/driveApi';
import type { Drive } from '../../../types/drive';

export interface DriveSelectorProps {
  selectedDriveId: number | null;
  onSelectDrive: (driveId: number | null) => void;
  className?: string;
}

/**
 * DriveSelector:
 * Dropdown selector loading up to 50 campus drives (all statuses).
 * Formatted as "Company - Role (Status)".
 */
export const DriveSelector: React.FC<DriveSelectorProps> = ({
  selectedDriveId,
  onSelectDrive,
  className = '',
}) => {
  const { data: drivesData, isLoading } = useQuery({
    queryKey: ['drives', { limit: 50 }],
    queryFn: () => getDrives({ limit: 50 }),
  });

  const drives: Drive[] = drivesData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onSelectDrive(null);
    } else {
      const parsed = parseInt(val, 10);
      onSelectDrive(isNaN(parsed) ? null : parsed);
    }
  };

  return (
    <div className={`relative flex items-center min-w-[280px] sm:min-w-[340px] ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none z-10">
        <Briefcase className="w-4 h-4" />
      </div>
      <Select
        value={selectedDriveId ? selectedDriveId.toString() : ''}
        onChange={handleChange}
        disabled={isLoading}
        className="pl-9 pr-8 py-2 text-sm font-medium w-full"
      >
        <option value="">-- Choose a placement drive --</option>
        {drives.map((drive) => (
          <option key={drive.id} value={drive.id}>
            {drive.companyName} - {drive.role} ({drive.status})
          </option>
        ))}
      </Select>
    </div>
  );
};
