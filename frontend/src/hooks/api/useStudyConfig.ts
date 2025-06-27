import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface StudyDay {
  day: string;
  hours: number;
}

interface StudyConfiguration {
  id: string;
  user_id: string;
  start_date: string;
  study_days: StudyDay[];
  selected_technologies: string[];
  total_weekly_hours: number;
  total_selected_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateStudyConfigData {
  startDate: string;
  studyDays: StudyDay[];
  selectedTechnologies: string[];
  generateSchedule?: boolean;
}

interface TechnologyStudySession {
  id: string;
  user_id: string;
  configuration_id: string;
  technology_id: string;
  subtopic_id: string;
  scheduled_date: string;
  scheduled_hours: number;
  subtopic_progress_hours: number;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  technology: {
    id: string;
    name: string;
    icon_name: string;
  };
  subtopic: {
    id: string;
    name: string;
    difficulty_level: 'iniciante' | 'intermediario' | 'avancado';
    hours_required: number;
  };
}

interface StudySessionFilters {
  startDate?: string;
  endDate?: string;
  technologyId?: string;
  completed?: boolean;
  page?: number;
  limit?: number;
}

export function useStudyConfig() {
  const queryClient = useQueryClient();

  const studyConfig = useQuery({
    queryKey: ['studyConfig'],
    queryFn: async () => {
      const response = await api.get<StudyConfiguration>('/study-config');
      return response.data;
    },
  });

  const createStudyConfig = useMutation({
    mutationFn: async (data: CreateStudyConfigData) => {
      const response = await api.post('/study-config', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyConfig'] });
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Configuração de estudos criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao criar configuração de estudos');
    },
  });

  const updateStudyConfig = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateStudyConfigData> }) => {
      const response = await api.put(`/study-config/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyConfig'] });
      toast.success('Configuração de estudos atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao atualizar configuração de estudos');
    },
  });

  const deleteStudyConfig = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/study-config/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyConfig'] });
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Configuração de estudos removida com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao remover configuração de estudos');
    },
  });

  const generateSchedule = useMutation({
    mutationFn: async (configId: string) => {
      const response = await api.post(`/study-config/${configId}/generate-schedule`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success(`Cronograma gerado com sucesso! ${data.sessionsCreated} sessões criadas.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao gerar cronograma');
    },
  });

  const studySessions = (filters: StudySessionFilters = {}) =>
    useQuery({
      queryKey: ['studySessions', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.technologyId) params.append('technologyId', filters.technologyId);
        if (filters.completed !== undefined) params.append('completed', filters.completed.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await api.get<TechnologyStudySession[]>(`/study-config/sessions?${params.toString()}`);
        return response.data;
      },
    });

  const studySessionsForCalendar = (filters: { startDate?: string; endDate?: string } = {}) =>
    useQuery({
      queryKey: ['studySessionsCalendar', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(`/study-config/sessions/calendar?${params.toString()}`);
        return response.data;
      },
    });

  const completeStudySession = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      const response = await api.put(`/study-config/sessions/${sessionId}/complete`, { notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      queryClient.invalidateQueries({ queryKey: ['studySessionsCalendar'] });
      toast.success('Sessão de estudo concluída!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao concluir sessão de estudo');
    },
  });

  const updateStudySession = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
      const response = await api.put(`/study-config/sessions/${sessionId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      queryClient.invalidateQueries({ queryKey: ['studySessionsCalendar'] });
      toast.success('Sessão de estudo atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao atualizar sessão de estudo');
    },
  });

  const deleteStudySession = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/study-config/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      queryClient.invalidateQueries({ queryKey: ['studySessionsCalendar'] });
      toast.success('Sessão de estudo removida!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao remover sessão de estudo');
    },
  });

  const bulkCompleteStudySessions = useMutation({
    mutationFn: async ({ sessionIds, notes }: { sessionIds: string[]; notes?: string }) => {
      const response = await api.post('/study-config/sessions/bulk-complete', { sessionIds, notes });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      queryClient.invalidateQueries({ queryKey: ['studySessionsCalendar'] });
      toast.success(`${data.completedCount} sessões concluídas com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao concluir sessões de estudo');
    },
  });

  const bulkDeleteStudySessions = useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const response = await api.post('/study-config/sessions/bulk-delete', { sessionIds });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      queryClient.invalidateQueries({ queryKey: ['studySessionsCalendar'] });
      toast.success(`${data.deletedCount} sessões removidas com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Falha ao remover sessões de estudo');
    },
  });

  return {
    studyConfig,
    createStudyConfig,
    updateStudyConfig,
    deleteStudyConfig,
    generateSchedule,
    studySessions,
    studySessionsForCalendar,
    completeStudySession,
    updateStudySession,
    deleteStudySession,
    bulkCompleteStudySessions,
    bulkDeleteStudySessions,
  };
}