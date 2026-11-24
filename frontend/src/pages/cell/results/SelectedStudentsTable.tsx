import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Mail,
  RotateCcw,
  Search,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '../../../components/ui/Select';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../context/useToast';
import { downloadCsv, toCsv } from '../../../utils/csv';
import type { SelectedStudent } from '../../../types/results';

export interface SelectedStudentsTableProps {
  selectedStudents: SelectedStudent[];
  companyName: string;
  role: string;
  isLoading?: boolean;
}

/**
 * SelectedStudentsTable:
 * Renders hired/selected candidates with client-side search (300ms debounce),
 * name/CGPA sorting, pagination (10/page), CSV export, and email copying.
 */
export const SelectedStudentsTable: React.FC<SelectedStudentsTableProps> = ({
  selectedStudents,
  companyName,
  role,
  isLoading = false,
}) => {
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'cgpa_desc' | 'cgpa_asc'>('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search by 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let list = [...selectedStudents];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter((item) => {
        const s = item.student;
        const nameMatch = s.name.toLowerCase().includes(q);
        const emailMatch = s.email.toLowerCase().includes(q);
        const rollMatch = s.profile?.rollNo?.toLowerCase().includes(q) ?? false;
        return nameMatch || emailMatch || rollMatch;
      });
    }

    list.sort((a, b) => {
      if (sortOption === 'name_asc') {
        return a.student.name.localeCompare(b.student.name);
      }
      if (sortOption === 'name_desc') {
        return b.student.name.localeCompare(a.student.name);
      }
      if (sortOption === 'cgpa_desc') {
        return (b.student.profile?.cgpa ?? 0) - (a.student.profile?.cgpa ?? 0);
      }
      if (sortOption === 'cgpa_asc') {
        return (a.student.profile?.cgpa ?? 0) - (b.student.profile?.cgpa ?? 0);
      }
      return 0;
    });

    return list;
  }, [selectedStudents, debouncedSearch, sortOption]);

  // Client-side pagination (10 per page)
  const pageSize = 10;
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedStudents = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, safePage, pageSize]);

  // Export CSV handler
  const handleExportCsv = () => {
    try {
      const headers = ['Name', 'Email', 'Roll No', 'Branch', 'CGPA'];
      const rows = selectedStudents.map((item) => [
        item.student.name,
        item.student.email,
        item.student.profile?.rollNo || '',
        item.student.profile?.branch || '',
        item.student.profile?.cgpa !== undefined ? item.student.profile.cgpa.toFixed(2) : '',
      ]);

      const csvContent = toCsv(headers, rows);
      const cleanCompany = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cleanRole = role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `results-${cleanCompany}-${cleanRole}.csv`;

      downloadCsv(filename, csvContent);
      success(`Exported ${selectedStudents.length} candidate record(s) to CSV.`);
    } catch {
      toastError('Failed to generate CSV export.');
    }
  };

  // Copy emails handler
  const handleCopyEmails = async () => {
    const emails = selectedStudents
      .map((s) => s.student.email)
      .filter(Boolean)
      .join(', ');

    if (!emails) {
      toastError('No candidate emails to copy.');
      return;
    }

    try {
      await navigator.clipboard.writeText(emails);
      success(`Copied ${selectedStudents.length} email${selectedStudents.length === 1 ? '' : 's'} to clipboard`);
    } catch {
      toastError('Failed to copy emails to clipboard.');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  if (selectedStudents.length === 0) {
    return (
      <EmptyState
        icon={<UserCheck className="w-6 h-6 text-navy-700" />}
        title="No students were selected for this drive."
        description="No candidates were marked as Selected prior to publication."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Action Bar */}
      <div className="bg-surface border border-grey-200 rounded-xl p-4 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search and Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-grey-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, roll no..."
              className="w-full rounded-lg border border-grey-200 bg-surface text-grey-700 text-sm py-2 pl-9 pr-3 transition-colors placeholder:text-grey-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {/* Sort */}
          <div className="w-full sm:w-48">
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
              className="py-2 text-sm w-full"
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="cgpa_desc">CGPA (Highest)</option>
              <option value="cgpa_asc">CGPA (Lowest)</option>
            </Select>
          </div>
        </div>

        {/* Right: Export CSV & Copy Emails Actions */}
        <div className="flex items-center gap-2.5 self-end lg:self-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyEmails}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Copy emails
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Results Table & Cards */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<Search className="w-6 h-6 text-navy-700" />}
          title="No matching students found"
          description="Try adjusting your filter query."
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSearch('')}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-surface border border-grey-200 rounded-xl overflow-hidden shadow-soft">
            <table className="w-full text-left text-sm border-collapse" aria-label="Selected hired candidates table">
              <thead>
                <tr className="bg-grey-50/80 border-b border-grey-200 text-xs font-semibold text-grey-600 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Student</th>
                  <th scope="col" className="py-3 px-4">Email</th>
                  <th scope="col" className="py-3 px-4">Roll Number</th>
                  <th scope="col" className="py-3 px-4">Branch</th>
                  <th scope="col" className="py-3 px-4 text-right">CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-200 text-grey-700">
                {paginatedStudents.map((item) => {
                  const s = item.student;
                  return (
                    <tr key={s.id} className="hover:bg-grey-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-navy-900">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`mailto:${s.email}`}
                          className="text-xs text-emerald-800 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{s.email}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-grey-600">
                        {s.profile?.rollNo || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-navy-900">
                        {s.profile?.branch || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-navy-900">
                        {s.profile?.cgpa !== undefined ? s.profile.cgpa.toFixed(2) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {paginatedStudents.map((item) => {
              const s = item.student;
              return (
                <Card key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">{s.name}</h4>
                      <p className="text-xs text-grey-500 font-mono mt-0.5">
                        Roll: {s.profile?.rollNo || '—'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-navy-900 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {s.profile?.cgpa !== undefined ? `${s.profile.cgpa.toFixed(2)} CGPA` : '—'}
                    </span>
                  </div>

                  <div className="text-xs flex items-center justify-between pt-1 border-t border-grey-200/60">
                    <span className="text-grey-600">{s.profile?.branch || 'General'}</span>
                    <a
                      href={`mailto:${s.email}`}
                      className="text-emerald-800 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3 text-emerald-700" />
                      <span>{s.email}</span>
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-grey-500 order-2 sm:order-1">
              Showing{' '}
              <span className="font-semibold text-navy-900">
                {(safePage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-navy-900">
                {Math.min(safePage * pageSize, filteredStudents.length)}
              </span>{' '}
              of <span className="font-semibold text-navy-900">{filteredStudents.length}</span> selected candidates
            </p>

            {totalPages > 1 && (
              <div className="order-1 sm:order-2 w-full sm:w-auto flex justify-center">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
