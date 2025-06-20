import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Flex, Text, Button, Card } from '@radix-ui/themes';
import { CheckCircle, RotateCcw } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
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
      toast.error('Você precisa estar logado para resetar os dados', {
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
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Box>
            <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
              Calendário de estudo
            </Text>
            <Text size="3" color="gray">
              Acompanhe suas sessões de estudo e seu progresso
            </Text>
          </Box>
          <Button
            color="red"
            variant="solid"
            onClick={handleReset}
            disabled={resetting || isLoading}
          >
            <RotateCcw size={16} style={{ animation: resetting ? 'spin 1s linear infinite' : 'none' }} />
            {resetting ? 'Resetando...' : 'Resetar Dados'}
          </Button>
        </Flex>

        <Card size="3">
          <Box mb="4">
            <Flex gap="4">
              <Flex align="center" gap="2">
                <Box style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <Text size="2" color="gray">Concluídos</Text>
              </Flex>
            </Flex>
          </Box>

          {isLoading ? (
            <Flex justify="center" align="center" style={{ height: '200px' }}>
              <Text>Carregando...</Text>
            </Flex>
          ) : error ? (
            <Flex justify="center" align="center" style={{ height: '200px' }}>
              <Text color="red">Erro ao carregar sessões de estudo</Text>
            </Flex>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px' }}>
                    {completed && <CheckCircle size={16} color="white" />}
                    <span style={{ fontSize: '14px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        </Card>

        {selectedSession && (
          <QuizModal
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
            onComplete={() => {
              setSelectedSession(null);
            }}
          />
        )}
      </Box>
    </Layout>
  );
}