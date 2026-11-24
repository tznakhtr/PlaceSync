import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormErrorProps {
  message?: string | null;
  className?: string;
  action?: React.ReactNode;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '', action }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 p-3 rounded-xl bg-danger-bg text-danger text-sm border border-danger/20 ${className}`}
    >
      <AlertCircle className="w-5 h-5 shrink-0 text-danger mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">{message}</span>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
};
