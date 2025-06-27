import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      console.log('useUser: Fetching user data...');
      const response = await api.get('/auth/me');
      console.log('useUser: User data fetched successfully:', !!response.data);
      return response.data;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        console.log('useUser: 401 error, not retrying');
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!localStorage.getItem('sb-cbqwhkjttgkckhrdwhnx-auth-token'),
  });
}