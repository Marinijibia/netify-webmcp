import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Do not retry on 401 or 404
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const status = (error as { statusCode: number }).statusCode;
          if (status === 401 || status === 403 || status === 404) {
            return false;
          }
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
