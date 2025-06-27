import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface TechnologySubtopic {
  id: string;
  name: string;
  description: string;
  hours_required: number;
  difficulty_level: 'iniciante' | 'intermediario' | 'avancado';
  order_index: number;
}

interface Technology {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  total_hours: number;
  subtopics_count: number;
  created_at: string;
  updated_at: string;
}

export function useTechnologies() {
  const technologies = useQuery({
    queryKey: ['technologies'],
    queryFn: async () => {
      const response = await api.get<Technology[]>('/technologies');
      return response.data;
    },
  });

  return {
    technologies,
  };
}