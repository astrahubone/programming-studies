import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface Subject {
  id: string;
  title: string;
  color?: string;
  sub_subjects: SubSubject[];
}

interface SubSubject {
  id: string;
  title: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
}

interface CreateSubjectData {
  title: string;
  color?: string;
  subSubjects: {
    title: string;
    difficulty: 'fácil' | 'médio' | 'difícil';
  }[];
}

export function useSubjects() {
  const queryClient = useQueryClient();

  const subjects = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get<Subject[]>('/subjects');
      return response.data;
    },
  });

  const createSubject = useMutation({
    mutationFn: async (data: CreateSubjectData) => {
      const response = await api.post('/subjects', {
        title: data.title,
        color: data.color,
        sub_subjects: data.subSubjects
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create subject');
    },
  });

  const updateSubject = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateSubjectData }) => {
      const response = await api.put(`/subjects/${id}`, {
        title: data.title,
        color: data.color,
        sub_subjects: data.subSubjects
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update subject');
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete subject');
    },
  });

  return {
    subjects,
    createSubject,
    updateSubject,
    deleteSubject,
  };
}