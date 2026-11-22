import { AxiosError } from 'axios';

/**
 * Extracts a user-friendly error message from any error,
 * prioritizing backend response messages (e.g. NestJS validation or conflict messages).
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred. Please try again.',
): string {
  if (!error) return fallback;

  if (typeof error === 'object' && error !== null) {
    const axiosError = error as AxiosError<{ message?: string | string[]; error?: string }>;
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }
      if (typeof data.message === 'string') {
        return data.message;
      }
      if (typeof data.error === 'string') {
        return data.error;
      }
    }

    // Handle Network / Connection errors (e.g. backend server not running or connection refused)
    if (
      axiosError.message === 'Network Error' ||
      axiosError.code === 'ERR_NETWORK' ||
      axiosError.code === 'ECONNREFUSED' ||
      (axiosError.isAxiosError && !axiosError.response)
    ) {
      return 'Cannot reach the backend server (http://localhost:3000). Please ensure the backend is running.';
    }

    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
  }

  return fallback;
}
