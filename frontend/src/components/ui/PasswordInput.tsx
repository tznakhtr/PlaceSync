import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { IconInput, type IconInputProps } from './IconInput';

export interface PasswordInputProps extends Omit<IconInputProps, 'leftIcon' | 'rightElement' | 'type'> {
  /**
   * Optional key or signal (e.g. active tab or submit count) that forces password visibility to reset to hidden.
   */
  resetKey?: unknown;
}

/**
 * PasswordInput:
 * Secure password field with left Lock icon and toggleable Eye / EyeOff visibility button.
 * Accessible with type="button", aria-label, and aria-pressed.
 * Hidden by default, and resets to hidden when resetKey changes.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ resetKey, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Reset visibility to hidden whenever resetKey changes (e.g. tab switch or form submit)
    useEffect(() => {
      setShowPassword(false);
    }, [resetKey]);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const eyeButton = (
      <button
        type="button"
        disabled={disabled}
        onClick={toggleVisibility}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-grey-400 hover:text-navy-700
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Eye className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    );

    return (
      <IconInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="w-5 h-5" aria-hidden="true" />}
        rightElement={eyeButton}
        disabled={disabled}
        {...props}
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
