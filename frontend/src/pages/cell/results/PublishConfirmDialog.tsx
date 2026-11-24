import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Check, Lock, Users, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface PublishConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  companyName: string;
  selectedCount: number;
  rejectedCount: number;
  pendingCount: number;
  autoReject: boolean;
  isLoading?: boolean;
}

/**
 * PublishConfirmDialog:
 * Danger-styled modal ensuring placement cell coordinators explicitly acknowledge
 * irreversible publication of hiring outcomes.
 */
export const PublishConfirmDialog: React.FC<PublishConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  companyName,
  selectedCount,
  rejectedCount,
  pendingCount,
  autoReject,
  isLoading = false,
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync acknowledgement state when dialog opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsAcknowledged(false);
    }
  }

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const finalNotSelectedCount = rejectedCount + (autoReject ? pendingCount : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-dialog-title"
    >
      <div
        className="bg-surface rounded-xl border border-grey-200 shadow-xl max-w-lg w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger-bg text-danger flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="publish-dialog-title" className="text-lg font-bold text-navy-900 leading-snug">
                Publish results for {companyName}?
              </h3>
              <p className="text-xs font-semibold text-danger uppercase tracking-wider mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-grey-400 hover:text-grey-700 p-1 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Impact List */}
        <div className="bg-grey-50 rounded-lg p-3.5 border border-grey-200/80 text-xs text-grey-700 space-y-2">
          <p className="font-semibold text-navy-900">
            Publishing will immediately apply the following changes:
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong className="text-navy-900 font-semibold">{selectedCount}</strong> student{selectedCount === 1 ? '' : 's'} will see <strong className="text-emerald-800">Selected</strong> with offer details.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
              <span>
                <strong className="text-navy-900 font-semibold">{finalNotSelectedCount}</strong> student{finalNotSelectedCount === 1 ? '' : 's'} will see <strong className="text-danger">Not selected</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Bell className="w-3.5 h-3.5 text-navy-700 shrink-0 mt-0.5" />
              <span>
                Every applicant will receive an individual outcome notification.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-navy-700 shrink-0 mt-0.5" />
              <span>
                The placement drive will be locked as <strong className="text-navy-900 font-semibold">COMPLETED</strong>: no further edits, applications, or status modifications.
              </span>
            </li>
          </ul>
        </div>

        {/* Required Confirmation Checkbox */}
        <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-grey-50/80 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAcknowledged}
            onChange={(e) => setIsAcknowledged(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 mt-0.5 rounded border-grey-300 text-danger focus:ring-danger cursor-pointer"
          />
          <span className="text-xs font-semibold text-navy-900">
            I understand that results cannot be unpublished and this action is final.
          </span>
        </label>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-grey-200/60">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirm}
            disabled={!isAcknowledged || isLoading}
            isLoading={isLoading}
          >
            Publish results now
          </Button>
        </div>
      </div>
    </div>
  );
};
