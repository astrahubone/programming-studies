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
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store the token
      localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(data.session));
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to login');
    },
  });

  const register = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store the token
      localStorage.setItem('sb-cbqwhkjttgkckhrdwhnx-auth-token', JSON.stringify(data.session));
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to register');
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
      localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
      queryClient.clear();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to logout');
    },
  });

  return {
    login,
    register,
    logout,
  };
}