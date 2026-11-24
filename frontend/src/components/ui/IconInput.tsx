import React from 'react';

export interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

/**
 * IconInput:
 * Accessible text input with decorative left icon, visible label linked with htmlFor,
 * aria-describedby for errors/helpers, aria-invalid on error, and 44px min touch target.
 * Font size is text-base on mobile (>=16px) to prevent iOS auto-zoom.
 */
export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      leftIcon,
      rightElement,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-navy-900 mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative rounded-xl shadow-sm">
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-grey-400"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full min-h-[44px] rounded-xl border bg-surface text-grey-700 text-base sm:text-sm py-2 px-3
              transition-colors duration-150 placeholder:text-grey-400
              ${leftIcon ? 'pl-10' : ''}
              ${rightElement ? 'pr-11' : ''}
              ${
                error
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-grey-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }
              ${disabled ? 'bg-grey-50 text-grey-400 cursor-not-allowed' : ''}
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-danger font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-grey-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

IconInput.displayName = 'IconInput';
