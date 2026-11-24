import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { FormError } from '../../components/ui/FormError';
import { Input } from '../../components/ui/Input';
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
    formState: { errors, isSubmitting },
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
        <h2 className="text-xl font-bold text-navy-900">Create student account</h2>
        <p className="text-xs text-grey-500 mt-1">
          Join PlaceSync to apply for campus placement drives
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={serverError} />

        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="College Email Address"
          type="email"
          placeholder="jane.doe@college.edu"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          className="mt-2"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-grey-500">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-navy-700 hover:text-navy-900 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
