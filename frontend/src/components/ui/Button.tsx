import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-navy-700 hover:bg-navy-800 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700/50',
  success:
    'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
  secondary:
    'bg-surface border border-grey-200 text-navy-700 hover:bg-grey-50 hover:border-grey-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700/20',
  danger:
    'bg-danger hover:opacity-90 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md font-medium gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg font-medium gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg font-semibold gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center transition-all duration-150 select-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'disabled:bg-grey-200 disabled:text-grey-400 disabled:border-grey-200 disabled:shadow-none disabled:cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}
          ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" variant={variant === 'secondary' ? 'navy' : 'white'} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
