import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Mail, ShieldCheck } from 'lucide-react';
import { AuthSwitchCard } from '../../components/ui/AuthSwitchCard';
import { AuthTabs } from '../../components/ui/AuthTabs';
import { Button } from '../../components/ui/Button';
import { FormError } from '../../components/ui/FormError';
import { IconInput } from '../../components/ui/IconInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { RoleMismatchError, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/getErrorMessage';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawAs = searchParams.get('as');
  const activeTab: 'student' | 'admin' = rawAs === 'admin' ? 'admin' : 'student';

  usePageTitle(activeTab === 'admin' ? 'Admin Login' : 'Student Login');
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [mismatchRole, setMismatchRole] = useState<'STUDENT' | 'CELL' | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // One-time session expired notification when redirected from 401 interceptor
  useEffect(() => {
    try {
      if (sessionStorage.getItem('placesync_session_expired') === 'true') {
        sessionStorage.removeItem('placesync_session_expired');
        toastError('Your session expired. Please log in again.');
      }
    } catch {
      // Ignore
    }
  }, [toastError]);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { ref: emailFormRef, ...emailFieldProps } = register('email');

  // Focus email field on initial mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Handle tab switching: updates URL query param with replace, clears password & errors, keeps email, focuses email
  const handleTabChange = (nextTab: 'student' | 'admin') => {
    if (nextTab === 'admin') {
      setSearchParams({ as: 'admin' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }

    setValue('password', '');
    clearErrors();
    setServerError(null);
    setMismatchRole(null);

    // Reposition focus to the email field after tab switch
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setMismatchRole(null);

    const expectedRole = activeTab === 'admin' ? 'CELL' : 'STUDENT';

    try {
      const user = await login(values.email, values.password, expectedRole);
      if (user.role === 'CELL') {
        navigate('/cell');
      } else {
        navigate('/student');
      }
    } catch (err: unknown) {
      if (err instanceof RoleMismatchError) {
        setMismatchRole(err.actualRole);
        setServerError(err.message);
      } else {
        setServerError(getErrorMessage(err));
      }
    }
  };

  return (
    <div>
      {/* Top Segmented Tab Control */}
      <AuthTabs
        activeTab={activeTab}
        onChange={handleTabChange}
        className="mb-6"
      />

      {/* Header section with icon, bold title and descriptive subtitle */}
      <div className="mb-6 text-center">
        <div
          className="w-14 h-14 rounded-2xl bg-navy-50 border border-navy-100 text-navy-700 flex items-center justify-center mx-auto mb-3 shadow-sm"
          aria-hidden="true"
        >
          {activeTab === 'student' ? (
            <GraduationCap className="w-8 h-8 text-navy-700" />
          ) : (
            <ShieldCheck className="w-8 h-8 text-navy-700" />
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
          {activeTab === 'student' ? 'Student Login' : 'Admin Login'}
        </h1>
        <p className="text-xs sm:text-sm text-grey-500 mt-1">
          {activeTab === 'student'
            ? 'Sign in to access your student account'
            : 'Sign in to access the placement cell dashboard'}
        </p>
      </div>

      {/* Form area marked with role="tabpanel" linked to the active tab */}
      <div
        role="tabpanel"
        id="auth-tabpanel"
        aria-labelledby={activeTab === 'student' ? 'tab-student' : 'tab-admin'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormError
            message={serverError}
            action={
              mismatchRole ? (
                <button
                  type="button"
                  onClick={() =>
                    handleTabChange(mismatchRole === 'CELL' ? 'admin' : 'student')
                  }
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors focus:outline-none focus:ring-2 focus:ring-danger/30"
                >
                  {mismatchRole === 'CELL'
                    ? 'Go to Admin Login'
                    : 'Go to Student Login'}
                </button>
              ) : null
            }
          />

          <IconInput
            label="Email Address"
            type="email"
            inputMode="email"
            placeholder={
              activeTab === 'student'
                ? 'student@college.edu'
                : 'admin@college.edu'
            }
            autoComplete="email"
            required
            leftIcon={<Mail className="w-5 h-5 text-grey-400" />}
            error={errors.email?.message}
            ref={(element) => {
              emailFormRef(element);
              emailInputRef.current = element;
            }}
            {...emailFieldProps}
          />

          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            resetKey={`${activeTab}-${submitCount}`}
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isSubmitting}
            className="w-full flex items-center justify-center whitespace-nowrap mt-2"
          >
            {activeTab === 'student' ? 'Login as Student' : 'Login as Admin'}
          </Button>
        </form>

        {/* Student tab only: divider row with registration link */}
        {activeTab === 'student' && (
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-grey-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-grey-500">
                New student?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-navy-700 hover:text-navy-900 transition-colors underline-offset-2 hover:underline"
                >
                  Create an account
                </Link>
              </span>
            </div>
          </div>
        )}

        {/* Bottom card that smoothly switches to the alternate login portal */}
        <AuthSwitchCard
          currentTab={activeTab}
          onSwitch={() =>
            handleTabChange(activeTab === 'student' ? 'admin' : 'student')
          }
          className="mt-6"
        />
      </div>
    </div>
  );
};
