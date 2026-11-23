import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export interface SkillChipsProps {
  requiredSkills: string[];
  studentSkills?: string[];
  className?: string;
}

/**
 * Renders technical skill chips with optional match comparison against the student's skills.
 * Informational only; does not affect backend eligibility evaluation.
 */
export const SkillChips: React.FC<SkillChipsProps> = ({
  requiredSkills = [],
  studentSkills = [],
  className = '',
}) => {
  if (requiredSkills.length === 0) {
    return (
      <p className="text-xs text-grey-500 italic">
        No specific technical skills specified for this drive.
      </p>
    );
  }

  // Normalize student skills for case-insensitive matching
  const studentSkillSet = new Set(
    studentSkills.map((s) => s.trim().toLowerCase()),
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach((skill) => {
    if (studentSkillSet.has(skill.trim().toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const hasStudentProfile = studentSkills.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* If student skills are present, show matching vs missing groups */}
      {hasStudentProfile ? (
        <>
          {matchedSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Matching Skills in Your Profile ({matchedSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-500/20"
                  >
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-grey-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-grey-400" />
                Skills to Acquire / Not in Profile ({missingSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-grey-50 text-grey-700 border border-grey-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Simple skill chips if profile is missing */
        <div className="flex flex-wrap gap-1.5">
          {requiredSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-navy-50 text-navy-800 border border-navy-100"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
