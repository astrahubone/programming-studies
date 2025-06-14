import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

interface UserFilters {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  status?: string;
}

export function useAdmin() {
  const queryClient = useQueryClient();

  const dashboardStats = useQuery({
    queryKey: ['admin', 'dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    },
  });

  const users = (filters: UserFilters = {}) => 
    useQuery({
      queryKey: ['admin', 'users', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.perPage) params.append('perPage', filters.perPage.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);

        const response = await api.get<PaginatedResponse<any>>(`/admin/users?${params.toString()}`);
        return response.data;
      },
    });

  const subscriptions = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const response = await api.get('/admin/subscriptions');
      return response.data;
    },
  });

  const performance = useQuery({
    queryKey: ['admin', 'performance'],
    queryFn: async () => {
      const response = await api.get('/admin/performance/users');
      return response.data;
    },
  });

  const dailyStats = useQuery({
    queryKey: ['admin', 'dailyStats'],
    queryFn: async () => {
      const response = await api.get('/admin/performance/daily');
      return response.data;
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create user');
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  const banUser = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/users/${id}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User banned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to ban user');
    },
  });

  const unbanUser = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/users/${id}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User unbanned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unban user');
    },
  });

  const promoteToAdmin = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/users/${id}/promote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User promoted to admin successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to promote user to admin');
    },
  });

  const demoteFromAdmin = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/users/${id}/demote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Admin demoted to regular user successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to demote admin to user');
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/subscriptions/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel subscription');
    },
  });

  return {
    dashboardStats,
    users,
    subscriptions,
    performance,
    dailyStats,
    createUser,
    updateUser,
    deleteUser,
    banUser,
    unbanUser,
    promoteToAdmin,
    demoteFromAdmin,
    cancelSubscription,
  };
}