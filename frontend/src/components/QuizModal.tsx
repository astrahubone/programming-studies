import React, { useState, useEffect } from 'react';
import { XCircle, CheckCircle, XCircle as XIcon, RefreshCw } from 'lucide-react';
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

type StudyMode = 'platform' | 'manual' | null;

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {reviewMode ? 'Carregando resultados...' : 'Gerando questões...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <XCircle className="h-12 w-12 mx-auto mb-2" />
              <p>{error}</p>
            </div>
            <div className="space-x-4">
              {retrying ? (
                <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  <span>Tentando novamente...</span>
                </div>
              ) : (
                <>
                  {retryCount < MAX_RETRIES && (
                    <button
                      onClick={() => loadQuestions(false)}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2 inline" />
                      Tentar Novamente
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Fechar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Study Mode Selection Screen
  if (!reviewMode && studyMode === null) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {session.sub_subject.subject.title} - {session.sub_subject.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {format(addDays(new Date(session.scheduled_date), 1), 'PPP', { locale: ptBR })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Como você deseja registrar seu estudo?
            </h4>
            <button
              onClick={() => {
                setStudyMode('platform');
                loadQuestions();
              }}
              className="w-full p-4 text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <div className="font-medium text-gray-900 dark:text-white">Estudar com questões da plataforma</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A plataforma irá gerar questões personalizadas para você responder
              </p>
            </button>
            <button
              onClick={() => setStudyMode('manual')}
              className="w-full p-4 text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <div className="font-medium text-gray-900 dark:text-white">Informar questões manualmente</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Registre o número de questões que você já estudou e quantas acertou
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual Questions Entry Screen
  if (!reviewMode && studyMode === 'manual') {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {session.sub_subject.subject.title} - {session.sub_subject.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {format(addDays(new Date(session.scheduled_date), 1), 'PPP', { locale: ptBR })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Registre seu desempenho
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de questões estudadas
              </label>
              <input
                type="number"
                min="0"
                value={manualQuestions.total}
                onChange={(e) => setManualQuestions(prev => ({ ...prev, total: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Número de questões corretas
              </label>
              <input
                type="number"
                min="0"
                max={manualQuestions.total}
                value={manualQuestions.correct}
                onChange={(e) => setManualQuestions(prev => ({ ...prev, correct: parseInt(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStudyMode(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Voltar
              </button>
              <button
                onClick={handleManualComplete}
                disabled={submitting || manualQuestions.total === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Platform Questions Screen
  const question = questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {session.sub_subject.subject.title} - {session.sub_subject.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {format(addDays(new Date(session.scheduled_date), 1), 'PPP', { locale: ptBR })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Questão {currentQuestion + 1} de {questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">{question.content}</p>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={reviewMode}
                className={`w-full text-left p-4 rounded-lg border ${
                  reviewMode
                    ? question.selectedAnswer === option
                      ? option === question.correctAnswer
                        ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/50'
                        : 'border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-900/50'
                      : option === question.correctAnswer
                      ? 'border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/50'
                      : 'border-gray-300 dark:border-gray-600'
                    : question.selectedAnswer === option
                    ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/50'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {['A', 'B', 'C', 'D'][index]}) {option}
                  </span>
                  {reviewMode && (
                    <>
                      {question.selectedAnswer === option && option === question.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                      )}
                      {question.selectedAnswer === option && option !== question.correctAnswer && (
                        <XIcon className="h-5 w-5 text-red-600 dark:text-red-500" />
                      )}
                      {question.selectedAnswer !== option && option === question.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                      )}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Anterior
          </button>
          {!reviewMode && currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleQuizComplete}
              disabled={submitting || questions.some(q => !q.selectedAnswer)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 border border-transparent rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Finalizar Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={reviewMode ? currentQuestion === questions.length - 1 : !question.selectedAnswer}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 border border-transparent rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
            >
              Próxima
            </button>
          )}
        </div>
      </div>
    </div>
  );
}