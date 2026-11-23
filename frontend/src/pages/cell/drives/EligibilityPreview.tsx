import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { describeEligibility } from '../../../utils/format';

export interface EligibilityPreviewProps {
  values: {
    allowedBranches?: string[];
    graduationYear?: number;
    minCgpa?: number;
    maxBacklogs?: number;
  };
}

/**
 * Live preview card describing who can apply in natural language.
 * Updates in real-time as the user modifies criteria in the form.
 */
export const EligibilityPreview: React.FC<EligibilityPreviewProps> = ({ values }) => {
  const sentence = describeEligibility(values);

  return (
    <Card className="p-4 bg-navy-50/60 border border-navy-100 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-grey-500 block">
            Who Can Apply (Live Preview)
          </span>
          <p className="text-sm font-semibold text-navy-900 mt-1 leading-relaxed">
            "{sentence}"
          </p>
          <span className="text-[11px] text-grey-500 mt-0.5 block">
            This plain-text summary updates dynamically based on your current eligibility rules.
          </span>
        </div>
      </div>
    </Card>
  );
};
