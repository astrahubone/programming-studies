import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Flex, Text, Button, Card, Dialog, TextField } from '@radix-ui/themes';
import { CheckCircle, RotateCcw, Clock, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useStudyConfig } from '../hooks/api/useStudyConfig';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

interface TechnologyStudySession {
  id: string;
  scheduled_date: string;
  scheduled_hours: number;
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

const DEFAULT_COLORS = {
  iniciante: '#60A5FA',
  intermediario: '#F59E0B',
  avancado: '#EF4444'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<TechnologyStudySession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Estado para controlar as datas do calendário com cache inteligente
  const [calendarDateRange, setCalendarDateRange] = useState(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const futureMonthEnd = endOfMonth(addMonths(today, 5)); // 5 meses à frente
    
    return {
      startDate: format(currentMonthStart, 'yyyy-MM-dd'),
      endDate: format(futureMonthEnd, 'yyyy-MM-dd'),
      currentViewStart: format(currentMonthStart, 'yyyy-MM-dd'),
      currentViewEnd: format(endOfMonth(today), 'yyyy-MM-dd'),
      cacheUntil: futureMonthEnd
    };
  });

  const { 
    completeStudySession,
    deleteStudySession
  } = useStudyConfig();

  // Buscar sessões para o período em cache
  const calendarSessions = useStudyConfig().studySessionsForCalendar({
    startDate: calendarDateRange.startDate,
    endDate: calendarDateRange.endDate
  });

  // Filtrar eventos apenas para o período visível atual
  const visibleEvents = useMemo(() => {
    if (!calendarSessions.data) return [];
    
    return calendarSessions.data.filter((session: any) => {
      const sessionDate = session.date;
      return sessionDate >= calendarDateRange.currentViewStart && 
             sessionDate <= calendarDateRange.currentViewEnd;
    });
  }, [calendarSessions.data, calendarDateRange.currentViewStart, calendarDateRange.currentViewEnd]);

  // Callback para quando as datas do calendário mudarem
  const handleDatesSet = useCallback((dateInfo: any) => {
    const newViewStart = format(dateInfo.start, 'yyyy-MM-dd');
    const newViewEnd = format(new Date(dateInfo.end.getTime() - 1), 'yyyy-MM-dd');
    
    console.log('Dashboard: Calendar view changed:', { newViewStart, newViewEnd });
    
    setCalendarDateRange(prev => {
      const newViewEndDate = new Date(newViewEnd);
      const cacheEndDate = new Date(prev.endDate);
      
      // Se a nova visualização está dentro do cache, apenas atualizar a view
      if (newViewEndDate <= cacheEndDate) {
        console.log('Dashboard: Using cached data, updating view only');
        return {
          ...prev,
          currentViewStart: newViewStart,
          currentViewEnd: newViewEnd
        };
      }
      
      // Se precisamos de mais dados, expandir o cache
      console.log('Dashboard: Expanding cache for new data');
      const newCacheEnd = endOfMonth(addMonths(newViewEndDate, 5));
      
      // CORREÇÃO: Manter a visualização atual e expandir apenas o cache
      return {
        startDate: prev.startDate, // Manter o início do cache
        endDate: format(newCacheEnd, 'yyyy-MM-dd'), // Expandir o fim do cache
        currentViewStart: newViewStart, // Atualizar a visualização atual
        currentViewEnd: newViewEnd, // Atualizar a visualização atual
        cacheUntil: newCacheEnd
      };
    });
  }, []);

  const handleEventClick = ({ event }: any) => {
    const sessionData = event.extendedProps.session;
    if (sessionData) {
      setSelectedSession(sessionData);
      setSessionNotes(sessionData.notes || '');
      setShowSessionModal(true);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;

    try {
      await completeStudySession.mutateAsync({
        sessionId: selectedSession.id,
        notes: sessionNotes.trim() || undefined
      });
      
      setShowSessionModal(false);
      setSelectedSession(null);
      setSessionNotes('');
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    if (!confirm('Tem certeza que deseja remover esta sessão de estudo?')) {
      return;
    }

    try {
      await deleteStudySession.mutateAsync(selectedSession.id);
      
      setShowSessionModal(false);
      setSelectedSession(null);
      setSessionNotes('');
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return 'Iniciante';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    return DEFAULT_COLORS[difficulty as keyof typeof DEFAULT_COLORS] || DEFAULT_COLORS.iniciante;
  };

  // Mostrar loading apenas se não temos dados em cache E estamos fazendo a primeira requisição
  const isLoading = calendarSessions.isLoading && !calendarSessions.data;

  return (
    <Layout>
      <Box p="6">
        <Flex justify="between" align="center" mb="6">
          <Box>
            <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
              Calendário de Estudos
            </Text>
            <Text size="3" color="gray">
              Acompanhe suas sessões de estudo e seu progresso
            </Text>
          </Box>
        </Flex>

        <Card size="3">
          <Box mb="4">
            <Flex gap="4">
              <Flex align="center" gap="2">
                <Box style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <Text size="2" color="gray">Concluído</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Box style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: DEFAULT_COLORS.iniciante }} />
                <Text size="2" color="gray">Iniciante</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Box style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: DEFAULT_COLORS.intermediario }} />
                <Text size="2" color="gray">Intermediário</Text>
              </Flex>
              <Flex align="center" gap="2">
                <Box style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: DEFAULT_COLORS.avancado }} />
                <Text size="2" color="gray">Avançado</Text>
              </Flex>
            </Flex>
          </Box>

          {isLoading ? (
            <Flex justify="center" align="center" style={{ height: '200px' }}>
              <Text>Carregando sessões...</Text>
            </Flex>
          ) : calendarSessions.error ? (
            <Flex justify="center" align="center" style={{ height: '200px' }}>
              <Text color="red">Erro ao carregar sessões de estudo</Text>
            </Flex>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={visibleEvents}
              eventClick={handleEventClick}
              datesSet={handleDatesSet}
              eventContent={(eventInfo) => {
                const completed = eventInfo.event.extendedProps.completed;
                const hours = eventInfo.event.extendedProps.hours;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px' }}>
                    {completed && <CheckCircle size={12} color="white" />}
                    <Clock size={12} color="white" />
                    <span style={{ fontSize: '11px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hours}h - {eventInfo.event.title}
                    </span>
                  </div>
                );
              }}
              height="auto"
              locale={ptBrLocale}
              className="fc-theme-standard"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
              }}
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventDisplay="block"
              displayEventTime={false}
              // Configurações para melhor performance e navegação
              lazyFetching={true}
              eventDidMount={(info) => {
                // Adicionar tooltip se necessário
                info.el.title = `${info.event.extendedProps.technology} - ${info.event.extendedProps.subtopic}`;
              }}
              // CORREÇÃO: Não permitir que o FullCalendar mude a view automaticamente
              // quando os dados são carregados
              viewDidMount={(view) => {
                console.log('Dashboard: View mounted:', view.view.type, view.view.currentStart);
              }}
              // Evitar que o calendário "pule" para datas específicas
              nowIndicator={false}
              // Manter a navegação suave
              aspectRatio={1.8}
            />
          )}
        </Card>

        {/* Session Details Modal */}
        <Dialog.Root open={showSessionModal} onOpenChange={setShowSessionModal}>
          <Dialog.Content style={{ maxWidth: '600px' }}>
            <Dialog.Title>
              Sessão de Estudo
            </Dialog.Title>
            
            {selectedSession && (
              <Box mt="4">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text size="4" weight="medium" mb="2" style={{ display: 'block' }}>
                      <BookOpen size={16} style={{ display: 'inline', marginRight: '8px' }} />
                      {selectedSession.technology.name} - {selectedSession.subtopic.name}
                    </Text>
                    <Flex gap="4" align="center">
                      <Text size="2" color="gray">
                        📅 {format(new Date(selectedSession.scheduled_date), 'dd/MM/yyyy')}
                      </Text>
                      <Text size="2" color="gray">
                        ⏱️ {selectedSession.scheduled_hours}h
                      </Text>
                      <Box
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'medium',
                          backgroundColor: `${getDifficultyColor(selectedSession.subtopic.difficulty_level)}20`,
                          color: getDifficultyColor(selectedSession.subtopic.difficulty_level),
                          border: `1px solid ${getDifficultyColor(selectedSession.subtopic.difficulty_level)}40`
                        }}
                      >
                        {getDifficultyLabel(selectedSession.subtopic.difficulty_level)}
                      </Box>
                    </Flex>
                  </Box>

                  {selectedSession.is_completed && (
                    <Box p="3" style={{ 
                      backgroundColor: 'var(--green-3)', 
                      borderRadius: '8px',
                      border: '1px solid var(--green-6)'
                    }}>
                      <Flex align="center" gap="2">
                        <CheckCircle size={16} color="var(--green-9)" />
                        <Text size="2" style={{ color: 'var(--green-11)' }}>
                          Concluído em {format(new Date(selectedSession.completed_at!), 'dd/MM/yyyy HH:mm')}
                        </Text>
                      </Flex>
                    </Box>
                  )}

                  <Box>
                    <Text as="label" size="2" weight="medium" mb="2" style={{ display: 'block' }}>
                      Notas (opcional)
                    </Text>
                    <TextField.Root
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Adicione suas anotações sobre esta sessão de estudo..."
                      disabled={selectedSession.is_completed}
                    />
                  </Box>

                  <Flex justify="between" gap="3">
                    <Button
                      variant="outline"
                      color="red"
                      onClick={handleDeleteSession}
                    >
                      Remover Sessão
                    </Button>
                    
                    <Flex gap="3">
                      <Dialog.Close>
                        <Button variant="outline">
                          Fechar
                        </Button>
                      </Dialog.Close>
                      
                      {!selectedSession.is_completed && (
                        <Button onClick={handleCompleteSession}>
                          <CheckCircle size={16} />
                          Marcar como Concluído
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Box>
            )}
          </Dialog.Content>
        </Dialog.Root>
      </Box>
    </Layout>
  );
}