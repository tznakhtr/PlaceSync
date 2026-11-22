import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[] | string[];
  placeholder?: string;
}

/**
 * Reusable Select dropdown component matching PlaceSync theme.
 * Integrates cleanly with react-hook-form via forwardRef.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      id,
      className = '',
      required,
      disabled,
      options,
      placeholder,
      children,
      ...props
    },
    ref,
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-grey-700 mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full rounded-lg border bg-surface text-grey-700 text-sm py-2 pl-3 pr-9
              transition-colors duration-150 appearance-none cursor-pointer
              ${
                error
                  ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                  : 'border-grey-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }
              ${disabled ? 'bg-grey-50 text-grey-400 cursor-not-allowed' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const lbl = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  );
                })
              : children}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-grey-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error ? (
          <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-grey-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
