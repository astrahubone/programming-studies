import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

export function useSubscription() {
  const queryClient = useQueryClient();

  const currentSubscription = useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: async () => {
      const response = await api.get('/subscription/current');
      return response.data;
    },
  });

  const createCheckoutSession = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await api.post('/subscription/checkout', { priceId });
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create checkout session');
    },
  });

  const createPortalSession = useMutation({
    mutationFn: async () => {
      const response = await api.post('/subscription/portal');
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe customer portal
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create portal session');
    },
  });

  return {
    currentSubscription,
    createCheckoutSession,
    createPortalSession,
  };
}