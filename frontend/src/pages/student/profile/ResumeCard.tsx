import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Lock,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { FormError } from '../../../components/ui/FormError';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../context/useToast';
import { deleteResume, uploadResume } from '../../../api/studentApi';
import { getErrorMessage } from '../../../utils/getErrorMessage';
import type { StudentProfile } from '../../../types/student';

interface ResumeCardProps {
  profile: StudentProfile | null;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB limit

export const ResumeCard: React.FC<ResumeCardProps> = ({ profile, onSuccess }) => {
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: () => {
      setLocalError(null);
      success('Resume uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      setLocalError(msg);
      toastError(msg);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      setLocalError(null);
      setIsDeleteDialogOpen(false);
      success('Resume deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err);
      setLocalError(msg);
      toastError(msg);
    },
  });

  // Process selected file with browser validation before uploading
  const processFile = (file?: File) => {
    setLocalError(null);
    if (!file) return;

    // Validate MIME type and file extension
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      const errorMsg = 'Only PDF files are allowed';
      setLocalError(errorMsg);
      toastError(errorMsg);
      return;
    }

    // Validate 2 MB size limit
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = 'Resume must be 2 MB or smaller';
      setLocalError(errorMsg);
      toastError(errorMsg);
      return;
    }

    // Upload using FormData without manually setting Content-Type
    uploadMutation.mutate(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!profile) return;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const hasResume = Boolean(profile?.resumeUrl);

  return (
    <>
      <Card className="p-6 md:p-8">
        <div className="border-b border-grey-200 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Resume / CV</h2>
            <p className="text-xs text-grey-500 mt-1">
              Upload your official resume for placement drives (PDF format, max 2 MB).
            </p>
          </div>
          {hasResume && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Resume uploaded</span>
            </span>
          )}
        </div>

        <FormError message={localError} className="mb-4" />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={!profile || isUploading || isDeleting}
        />

        {/* State 1: Profile not completed yet */}
        {!profile ? (
          <div className="border border-grey-200 bg-grey-50 rounded-xl p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-grey-200 text-grey-400 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-grey-700 mb-1">Resume Upload Locked</h3>
            <p className="text-xs text-grey-500 max-w-sm mb-4">
              Save your profile first, then upload your resume.
            </p>
            <Button variant="secondary" size="sm" disabled>
              Upload resume (PDF, max 2 MB)
            </Button>
          </div>
        ) : hasResume ? (
          /* State 2: Resume uploaded */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-navy-50/60 border border-navy-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">Official Placement Resume</p>
                  <p className="text-xs text-grey-500">PDF Document • Ready for applications</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={profile.resumeUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-grey-200 text-navy-700 hover:bg-grey-50 hover:border-grey-400 transition-colors shadow-xs"
                >
                  <span>View resume</span>
                  <ExternalLink className="w-3.5 h-3.5 text-grey-500" />
                </a>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                  disabled={isDeleting}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Replace
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isUploading || isDeleting}
                  className="text-danger hover:bg-danger-bg hover:border-danger/30"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                >
                  Delete
                </Button>
              </div>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-xs font-medium text-navy-700 p-2">
                <Spinner size="sm" variant="navy" />
                <span>Uploading replacement resume...</span>
              </div>
            )}
          </div>
        ) : (
          /* State 3: No resume uploaded yet - drop zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-grey-200 hover:border-emerald-500 bg-grey-50/50 hover:bg-grey-50'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center py-4">
                <Spinner size="lg" variant="emerald" className="mb-3" />
                <p className="text-sm font-semibold text-navy-900">Uploading resume...</p>
                <p className="text-xs text-grey-500 mt-1">
                  Validating PDF and storing securely on cloud
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-navy-900 mb-1">
                  Drag & drop your resume here
                </h3>
                <p className="text-xs text-grey-500 max-w-sm mb-4">
                  Supports PDF files only up to 2 MB. Click anywhere or use the button below.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  leftIcon={<FileText className="w-4 h-4" />}
                >
                  Upload resume (PDF, max 2 MB)
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Reusable Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Resume"
        message="Are you sure you want to delete your resume? Company recruiters will not be able to review your profile until a new resume is uploaded."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
};
