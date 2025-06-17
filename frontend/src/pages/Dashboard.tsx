import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, RotateCcw } from 'lucide-react';
import QuizModal from '../components/QuizModal';
import { toast } from 'react-toastify';
import { useStudySessions } from '../hooks/api/useStudySessions';

interface StudySession {
  id: string;
  sub_subject_id: string;
  scheduled_date: string;
  completed_at: string | null;
  sub_subject: {
    title: string;
    difficulty: 'fácil' | 'médio' | 'difícil';
    subject: {
      title: string;
      color?: string;
    };
  };
}

const DEFAULT_COLORS = {
  fácil: '#60A5FA',
  médio: '#F59E0B',
  difícil: '#EF4444'
};

export default function Dashboard() {
  const { user } = useAuth();
  const { studySessions: { data: sessions, isLoading, error }, resetStudyData } = useStudySessions();
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!user) {
      toast.error('Você precisa estars logado para resetar os dados', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    }

    if (!confirm('Tem certeza que deseja resetar todos os dados de estudo? Esta ação não pode ser desfeita.')) {
      return;
    }

    setResetting(true);
    try {
      await resetStudyData.mutateAsync();
      
      toast.success('Dados de estudo resetados com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      toast.error(
        error instanceof Error 
          ? `Erro ao resetar dados: ${error.message}`
          : 'Erro ao resetar dados de estudo', 
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
    } finally {
      setResetting(false);
    }
  }

  const events = sessions?.map(session => ({
    id: session.id,
    title: `${session.sub_subject.subject.title} - ${session.sub_subject.title}`,
    date: session.scheduled_date,
    backgroundColor: session.completed_at
      ? '#10B981'
      : session.sub_subject.subject.color || DEFAULT_COLORS[session.sub_subject.difficulty],
    borderColor: 'transparent',
    className: 'cursor-pointer',
    extendedProps: {
      completed: !!session.completed_at,
      difficulty: session.sub_subject.difficulty,
    },
  })) || [];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Calendário de estudo</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Acompanhe suas sessões de estudo e seu progresso
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting || isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetando...' : 'Resetar Dados'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-4 flex gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Concluído</span>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : error ? (
            <div className="mt-8 text-center text-red-600 dark:text-red-400">
              Erro ao carregar sessões de estudo
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={({ event }) => {
                const session = sessions?.find(s => s.id === event.id);
                if (session) {
                  setSelectedSession(session);
                }
              }}
              eventContent={(eventInfo) => {
                const completed = eventInfo.event.extendedProps.completed;
                return (
                  <div className="flex items-center gap-1 p-1">
                    {completed && <CheckCircle className="w-4 h-4 text-white" />}
                    <span className="text-sm text-white truncate">
                      {eventInfo.event.title}
                    </span>
                  </div>
                );
              }}
              height="auto"
              locale={ptBrLocale}
              className="fc-theme-custom dark:fc-theme-dark"
            />
          )}
        </div>

        {selectedSession && (
          <QuizModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onComplete={() => {
              setSelectedSession(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}