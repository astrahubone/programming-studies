import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface StudySession {
  id: string;
  sub_subject_id: string;
  scheduled_date: string;
  completed_at: string | null;
  questions_total: number | null;
  questions_correct: number | null;
  sub_subject: {
    title: string;
    difficulty: 'fácil' | 'médio' | 'difícil';
    subject: {
      title: string;
      color?: string;
    };
  };
}

interface CreateStudySessionData {
  subSubjectId: string;
  scheduledDate: string;
}

export function useStudySessions() {
  const queryClient = useQueryClient();

  const studySessions = useQuery({
    queryKey: ['studySessions'],
    queryFn: async () => {
      const response = await api.get<StudySession[]>('/study/sessions');
      return response.data;
    },
  });

  const createStudySession = useMutation({
    mutationFn: async (data: CreateStudySessionData) => {
      const response = await api.post('/study/sessions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Study session created successfully');
    },
    onError: (error: any) => {
      console.error('Study session creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create study session');
    },
  });

  const updateStudySession = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudySession> }) => {
      const response = await api.put(`/study/sessions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Study session updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update study session');
    },
  });

  const deleteStudySession = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/study/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Study session deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete study session');
    },
  });

  const resetStudyData = useMutation({
    mutationFn: async () => {
      await api.post('/study/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Study data reset successfully');
    },
    onError: (error: any) => {
      console.error('Reset study data error:', error);
      toast.error(error.response?.data?.error || 'Failed to reset study data');
    },
  });

  return {
    studySessions,
    createStudySession,
    updateStudySession,
    deleteStudySession,
    resetStudyData,
  };
}