import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for PlaceSync.
 * Allows cache clearance on logout or 401 session expiration across the entire app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});
