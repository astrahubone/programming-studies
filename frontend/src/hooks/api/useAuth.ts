import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  fullName: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: async (data: LoginData) => {
      console.log('useAuth: Making login request...');
      const response = await api.post('/auth/login', data);
      console.log('useAuth: Login response received:', response.status);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('useAuth: Login successful, storing session...');
      // Store the token manually since we're using custom API
      if (data.session) {
        localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(data.session));
      }
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      console.log('useAuth: Session stored and queries invalidated');
    },
    onError: (error: any) => {
      console.error('useAuth: Login error:', error);
      // Clear any stale tokens on login error
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      toast.error(error.response?.data?.error || 'Failed to login');
    },
  });

  const register = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store the token manually since we're using custom API
      if (data.session) {
        localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(data.session));
      }
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      // Clear any stale tokens on register error
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      toast.error(error.response?.data?.error || 'Failed to register');
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      queryClient.clear();
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      queryClient.clear();
      toast.error(error.response?.data?.error || 'Failed to logout');
    },
  });

  return {
    login,
    register,
    logout,
  };
}