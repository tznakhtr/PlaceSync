import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 p-3 rounded-lg bg-danger-bg text-danger text-sm border border-danger/20 ${className}`}
    >
      <AlertCircle className="w-5 h-5 shrink-0 text-danger mt-0.5" />
      <span className="flex-1 font-medium">{message}</span>
    </div>
  );
};
