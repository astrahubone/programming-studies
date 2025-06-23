import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle, XCircle as XIcon, RefreshCw, ExternalLink } from 'lucide-react';
import { Box, Flex, Text, Button, Card, Dialog, TextField, RadioGroup } from '@radix-ui/themes';
import { generateQuestions } from '../lib/openai';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useQuestions } from '../hooks/api/useQuestions';

interface Question {
  id?: string;
  content: string;
  correctAnswer: string;
  options: string[];
  selectedAnswer?: string;
  isCorrect?: boolean;
}

interface QuizModalProps {
  session: {
    id: string;
    sub_subject_id: string;
    scheduled_date: string;
    completed_at?: string | null;
    sub_subject: {
      title: string;
      subject: {
        title: string;
      };
      difficulty: 'fácil' | 'médio' | 'difícil';
    };
  };
  onClose: () => void;
  onComplete: () => void;
}

type StudyMode = 'platform' | 'manual' | 'study' | null;

export default function QuizModal({ session, onClose, onComplete }: QuizModalProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState(!!session.completed_at);
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [manualQuestions, setManualQuestions] = useState({ total: 0, correct: 0 });
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const { questions: questionsQuery, submitAnswers } = useQuestions(session.sub_subject_id);

  useEffect(() => {
    if (reviewMode) {
      loadCompletedQuiz();
    }
  }, [session, reviewMode]);

  async function loadCompletedQuiz() {
    try {
      setLoading(true);
      setError(null);

      const { data } = await questionsQuery.refetch();
      
      if (!data || data.length === 0) {
        throw new Error('Nenhuma questão encontrada para esta sessão');
      }

      const formattedQuestions = data.map(q => ({
        id: q.id,
        content: q.content,
        correctAnswer: q.correct_answer,
        options: q.options,
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Erro ao carregar quiz completado:', error);
      setError('Falha ao carregar o quiz. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(isRetry = false) {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        setRetrying(false);
      }

      const newQuestions = await generateQuestions(
        session.sub_subject.subject.title,
        session.sub_subject.title,
        session.sub_subject.difficulty,
        session.sub_subject_id
      );

      if (!newQuestions || newQuestions.length === 0) {
        throw new Error('Não foi possível gerar questões');
      }

      setQuestions(newQuestions);
      setRetryCount(0);
      setError(null);
      setRetrying(false);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount >= MAX_RETRIES) {
        setError('Número máximo de tentativas excedido. Por favor, tente novamente mais tarde.');
        setRetrying(false);
      } else {
        setError(
          error instanceof Error 
            ? `${error.message}. Tentativa ${newRetryCount} de ${MAX_RETRIES}.`
            : `Falha ao carregar as questões. Tentativa ${newRetryCount} de ${MAX_RETRIES}.`
        );
        setRetrying(true);
        
        setTimeout(() => {
          loadQuestions(true);
        }, RETRY_DELAY);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }

  async function handleAnswerSelect(answer: string) {
    if (reviewMode) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].selectedAnswer = answer;
    setQuestions(updatedQuestions);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  async function handleManualComplete() {
    try {
      setSubmitting(true);
      setError(null);

      if (manualQuestions.total < manualQuestions.correct) {
        throw new Error('O número de acertos não pode ser maior que o total de questões');
      }

      await submitAnswers.mutateAsync({
        sessionId: session.id,
        answers: [],
      });

      toast.success(`Sessão de estudo registrada com sucesso! Você acertou ${manualQuestions.correct} de ${manualQuestions.total} questões.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      setError(error instanceof Error ? error.message : 'Falha ao salvar a sessão de estudo');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuizComplete() {
    try {
      setSubmitting(true);
      setError(null);

      const answers = questions.map(q => ({
        question_id: q.id!,
        selected_answer: q.selectedAnswer!,
      }));

      const correctCount = answers.filter(r => r.is_correct).length;
      const totalCount = questions.length;

      await submitAnswers.mutateAsync({
        sessionId: session.id,
        answers,
      });

      toast.success(`Quiz completado! Você acertou ${correctCount} de ${totalCount} questões.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao completar o quiz:', error);
      setError('Falha ao salvar as respostas. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoToStudyPage() {
    // Temporarily redirect to Google as requested
    window.open('https://google.com', '_blank');
    onClose();
  }

  if (loading) {
    return (
      <Dialog.Root open={true}>
        <Dialog.Content style={{ maxWidth: '600px' }}>
          <Flex direction="column" align="center" gap="4" p="6">
            <Box style={{ animation: 'spin 1s linear infinite' }}>
              <RefreshCw size={32} />
            </Box>
            <Text size="3">
              {reviewMode ? 'Carregando resultados...' : 'Gerando questões...'}
            </Text>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  if (error) {
    return (
      <Dialog.Root open={true}>
        <Dialog.Content style={{ maxWidth: '600px' }}>
          <Flex direction="column" align="center" gap="4" p="6">
            <XCircle size={32} color="var(--red-9)" />
            <Text size="3" color="red" align="center">{error}</Text>
            <Flex gap="3">
              {retrying ? (
                <Flex align="center" gap="2">
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <Text size="2">Tentando novamente...</Text>
                </Flex>
              ) : (
                <>
                  {retryCount < MAX_RETRIES && (
                    <Button onClick={() => loadQuestions(false)}>
                      <RefreshCw size={16} />
                      Tentar Novamente
                    </Button>
                  )}
                  <Button variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                </>
              )}
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  // Study Mode Selection Screen
  if (!reviewMode && studyMode === null) {
    return (
      <Dialog.Root open={true}>
        <Dialog.Content style={{ maxWidth: '600px' }}>
          <Dialog.Title>
            {session.sub_subject.subject.title} - {session.sub_subject.title}
          </Dialog.Title>
          
          <Box mt="2" mb="4">
            <Text size="2" color="gray">
              {format(addDays(new Date(session.scheduled_date), 1), 'PPP', { locale: ptBR })}
            </Text>
          </Box>

          <Flex direction="column" gap="4">
            <Text size="4" weight="medium">
              Como você deseja estudar hoje?
            </Text>
            
            <Card 
              variant="surface" 
              size="3" 
              style={{ cursor: 'pointer' }}
              onClick={() => handleGoToStudyPage()}
            >
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <ExternalLink size={20} />
                  <Text size="3" weight="medium">Ir para a página de estudo</Text>
                </Flex>
                <Text size="2" color="gray">
                  Acesse materiais de estudo e recursos para este tópico
                </Text>
              </Flex>
            </Card>
            
            <Card 
              variant="surface" 
              size="3" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setStudyMode('platform');
                loadQuestions();
              }}
            >
              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Estudar com questões da plataforma</Text>
                <Text size="2" color="gray">
                  A plataforma irá gerar questões personalizadas para você responder
                </Text>
              </Flex>
            </Card>
            
            <Card 
              variant="surface" 
              size="3" 
              style={{ cursor: 'pointer' }}
              onClick={() => setStudyMode('manual')}
            >
              <Flex direction="column" gap="2">
                <Text size="3" weight="medium">Informar questões manualmente</Text>
                <Text size="2" color="gray">
                  Registre o número de questões que você já estudou e quantas acertou
                </Text>
              </Flex>
            </Card>
          </Flex>

          <Flex justify="end" mt="6">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  // Manual Questions Entry Screen
  if (!reviewMode && studyMode === 'manual') {
    return (
      <Dialog.Root open={true}>
        <Dialog.Content style={{ maxWidth: '600px' }}>
          <Dialog.Title>
            {session.sub_subject.subject.title} - {session.sub_subject.title}
          </Dialog.Title>
          
          <Box mt="2" mb="4">
            <Text size="2" color="gray">
              {format(addDays(new Date(session.scheduled_date), 1), 'PPP', { locale: ptBR })}
            </Text>
          </Box>

          <Flex direction="column" gap="4">
            <Text size="4" weight="medium">
              Registre seu desempenho
            </Text>
            
            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                Total de questões estudadas
              </Text>
              <TextField.Root
                type="number"
                min="0"
                value={manualQuestions.total.toString()}
                onChange={(e) => setManualQuestions(prev => ({ ...prev, total: parseInt(e.target.value) || 0 }))}
              />
            </Box>

            <Box>
              <Text as="label" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                Número de questões corretas
              </Text>
              <TextField.Root
                type="number"
                min="0"
                max={manualQuestions.total}
                value={manualQuestions.correct.toString()}
                onChange={(e) => setManualQuestions(prev => ({ ...prev, correct: parseInt(e.target.value) || 0 }))}
              />
            </Box>

            {error && (
              <Text size="2" color="red">
                {error}
              </Text>
            )}

            <Flex justify="between" mt="4">
              <Button variant="outline" onClick={() => setStudyMode(null)}>
                Voltar
              </Button>
              <Button
                onClick={handleManualComplete}
                disabled={submitting || manualQuestions.total === 0}
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  // Platform Questions Screen
  const question = questions[currentQuestion];

  return (
    <Dialog.Root open={true}>
      <Dialog.Content style={{ maxWidth: '700px' }}>
        <Dialog.Title>
          {session.sub_subject.subject.title} - {session.sub_subject.title}
        </Dialog.Title>
        
        <Box mt="2" mb="4">
          <Text size="2" color="gray">
            {format(addDays(new Date(session.scheduled_date), 1), 'PPP', { locale: ptBR })}
          </Text>
          <Text size="2" color="gray">
            Questão {currentQuestion + 1} de {questions.length}
          </Text>
        </Box>

        <Box mb="6">
          <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
            {question.content}
          </Text>
          
          <RadioGroup.Root
            value={question.selectedAnswer || ''}
            onValueChange={handleAnswerSelect}
            disabled={reviewMode}
          >
            <Flex direction="column" gap="3">
              {question.options.map((option, index) => (
                <Box
                  key={index}
                  p="3"
                  style={{
                    borderRadius: '8px',
                    border: reviewMode
                      ? question.selectedAnswer === option
                        ? option === question.correctAnswer
                          ? '2px solid var(--green-8)'
                          : '2px solid var(--red-8)'
                        : option === question.correctAnswer
                        ? '2px solid var(--green-8)'
                        : '1px solid var(--gray-6)'
                      : question.selectedAnswer === option
                      ? '2px solid var(--indigo-8)'
                      : '1px solid var(--gray-6)',
                    backgroundColor: reviewMode
                      ? question.selectedAnswer === option
                        ? option === question.correctAnswer
                          ? 'var(--green-3)'
                          : 'var(--red-3)'
                        : option === question.correctAnswer
                        ? 'var(--green-3)'
                        : 'var(--gray-2)'
                      : question.selectedAnswer === option
                      ? 'var(--indigo-3)'
                      : 'var(--gray-2)',
                    cursor: reviewMode ? 'default' : 'pointer'
                  }}
                  onClick={() => !reviewMode && handleAnswerSelect(option)}
                >
                  <Flex justify="between" align="center">
                    <RadioGroup.Item value={option} style={{ display: 'none' }} />
                    <Text size="2" weight="medium">
                      {['A', 'B', 'C', 'D'][index]}) {option}
                    </Text>
                    {reviewMode && (
                      <>
                        {question.selectedAnswer === option && option === question.correctAnswer && (
                          <CheckCircle size={20} color="var(--green-9)" />
                        )}
                        {question.selectedAnswer === option && option !== question.correctAnswer && (
                          <XIcon size={20} color="var(--red-9)" />
                        )}
                        {question.selectedAnswer !== option && option === question.correctAnswer && (
                          <CheckCircle size={20} color="var(--green-9)" />
                        )}
                      </>
                    )}
                  </Flex>
                </Box>
              ))}
            </Flex>
          </RadioGroup.Root>
        </Box>

        <Flex justify="between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>
          {!reviewMode && currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleQuizComplete}
              disabled={submitting || questions.some(q => !q.selectedAnswer)}
            >
              {submitting ? 'Salvando...' : 'Finalizar Quiz'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={reviewMode ? currentQuestion === questions.length - 1 : !question.selectedAnswer}
            >
              Próxima
            </Button>
          )}
        </Flex>

        <Flex justify="end" mt="4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}