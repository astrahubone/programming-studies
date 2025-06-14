import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-toastify';

interface Question {
  id: string;
  content: string;
  correct_answer: string;
  options: string[];
}

interface SubmitAnswersData {
  sessionId: string;
  answers: Array<{
    question_id: string;
    selected_answer: string;
  }>;
}

export function useQuestions(subSubjectId?: string) {
  const queryClient = useQueryClient();

  const questions = useQuery({
    queryKey: ['questions', subSubjectId],
    queryFn: async () => {
      const response = await api.get<Question[]>(`/study/questions/${subSubjectId}`);
      return response.data;
    },
    enabled: !!subSubjectId,
  });

  const generateQuestions = useMutation({
    mutationFn: async (subSubjectId: string) => {
      const response = await api.post<Question[]>(`/study/questions/${subSubjectId}`);
      return response.data;
    },
    onSuccess: (_, subSubjectId) => {
      queryClient.invalidateQueries({ queryKey: ['questions', subSubjectId] });
      toast.success('Questions generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate questions');
    },
  });

  const submitAnswers = useMutation({
    mutationFn: async (data: SubmitAnswersData) => {
      const response = await api.post(`/study/sessions/${data.sessionId}/questions`, {
        answers: data.answers,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studySessions'] });
      toast.success('Answers submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit answers');
    },
  });

  return {
    questions,
    generateQuestions,
    submitAnswers,
  };
}