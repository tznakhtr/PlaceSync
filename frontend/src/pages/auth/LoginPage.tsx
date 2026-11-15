import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { FormError } from '../../components/ui/FormError';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      if (user.role === 'CELL') {
        navigate('/cell');
      } else {
        navigate('/student');
      }
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-navy-900">Sign in to your account</h2>
        <p className="text-xs text-grey-500 mt-1">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={serverError} />

        <Input
          label="Email Address"
          type="email"
          placeholder="student@college.edu"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-grey-500">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-navy-700 hover:text-navy-900 transition-colors"
          >
            Register as Student
          </Link>
        </p>
      </div>
    </div>
  );
};
