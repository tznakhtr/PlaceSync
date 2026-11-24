import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormError } from '../../components/ui/FormError';
import { IconInput } from '../../components/ui/IconInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/getErrorMessage';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  usePageTitle('Register');
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      // Role is never passed from frontend; backend assigns STUDENT
      await registerAuth(values.name, values.email, values.password);
      navigate('/student');
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
          Create student account
        </h1>
        <p className="text-xs sm:text-sm text-grey-500 mt-1">
          Join PlaceSync to apply for campus placement drives
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={serverError} />

        <IconInput
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          required
          leftIcon={<User className="w-5 h-5 text-grey-400" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <IconInput
          label="College Email Address"
          type="email"
          inputMode="email"
          placeholder="jane.doe@college.edu"
          autoComplete="email"
          required
          leftIcon={<Mail className="w-5 h-5 text-grey-400" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label="Password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          required
          resetKey={submitCount}
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
          resetKey={submitCount}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          className="mt-2 min-h-[44px] flex items-center justify-center gap-2"
        >
          <span>Create Account</span>
          {!isSubmitting && (
            <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
          )}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-grey-500">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-navy-700 hover:text-navy-900 transition-colors underline-offset-2 hover:underline"
          >
            Sign In
          </Link>
        </p>

        <p className="text-xs text-grey-400">
          Administrator?{' '}
          <Link
            to="/login?as=admin"
            className="font-semibold text-navy-700 hover:text-navy-900 transition-colors underline-offset-2 hover:underline"
          >
            Admin login
          </Link>
        </p>
      </div>
    </div>
  );
};
