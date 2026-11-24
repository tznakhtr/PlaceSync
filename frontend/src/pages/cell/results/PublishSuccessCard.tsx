import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { PublishResponse } from '../../../types/results';

export interface PublishSuccessCardProps {
  response: PublishResponse;
  onDismiss?: () => void;
}

/**
 * PublishSuccessCard:
 * Celebratory confirmation banner highlighting final outcome counts
 * immediately after publishing drive results.
 */
export const PublishSuccessCard: React.FC<PublishSuccessCardProps> = ({
  response,
  onDismiss,
}) => {
  return (
    <Card className="p-6 bg-gradient-to-r from-emerald-50 via-surface to-emerald-50/30 border-emerald-500/30 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-900 tracking-tight">
              Recruitment Results Published!
            </h3>
            <p className="text-xs text-grey-600 mt-0.5">
              Notifications have been delivered to all candidate dashboards. The placement drive is now officially closed.
            </p>
          </div>
        </div>

        {onDismiss && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDismiss}
            className="self-start sm:self-auto"
          >
            Dismiss banner
          </Button>
        )}
      </div>

      {/* Outcome statistics */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20 text-xs">
        <div className="bg-surface/80 rounded-lg p-2.5 border border-grey-200">
          <span className="text-[10px] uppercase font-semibold text-grey-500 block">Total Candidates</span>
          <span className="text-lg font-bold text-navy-900">{response.total}</span>
        </div>
        <div className="bg-emerald-50/80 rounded-lg p-2.5 border border-emerald-500/20 text-emerald-900">
          <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Hired / Selected</span>
          <span className="text-lg font-bold text-emerald-800">{response.selected}</span>
        </div>
        <div className="bg-surface/80 rounded-lg p-2.5 border border-grey-200 text-grey-700">
          <span className="text-[10px] uppercase font-semibold text-grey-500 block">Not Selected</span>
          <span className="text-lg font-bold text-grey-700">{response.rejected}</span>
        </div>
      </div>
    </Card>
  );
};
