import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useStudySessions } from "../hooks/api/useStudySessions";

interface StudyStats {
  totalSessions: number;
  completedSessions: number;
  totalQuestions: number;
  correctQuestions: number;
  subjectPerformance: {
    subject: string;
    questionsTotal: number;
    questionsCorrect: number;
  }[];
  weeklyProgress: {
    week: string;
    completed: number;
    total: number;
  }[];
  difficultyDistribution: {
    difficulty: string;
    count: number;
  }[];
}

const COLORS = ["#60A5FA", "#F59E0B", "#EF4444"];

export default function Performance() {
  const { user } = useAuth();
  const { studySessions: { data: sessions, isLoading }, error } = useStudySessions();
  const [stats, setStats] = useState<StudyStats | null>(null);

  // Process stats when sessions data changes
  useEffect(() => {
    if (!sessions) return;

    const subjectPerformance = {};
    const weeklyProgress = {};
    const difficultyCount = {
      fácil: 0,
      médio: 0,
      difícil: 0,
    };

    let totalSessions = 0;
    let completedSessions = 0;
    let totalQuestions = 0;
    let correctQuestions = 0;

    sessions.forEach((session) => {
      totalSessions++;
      if (session.completed_at) {
        completedSessions++;
        totalQuestions += session.questions_total || 0;
        correctQuestions += session.questions_correct || 0;

        const subjectTitle = session.sub_subject.subject.title;
        if (!subjectPerformance[subjectTitle]) {
          subjectPerformance[subjectTitle] = {
            questionsTotal: 0,
            questionsCorrect: 0,
          };
        }
        subjectPerformance[subjectTitle].questionsTotal += session.questions_total || 0;
        subjectPerformance[subjectTitle].questionsCorrect += session.questions_correct || 0;

        const week = new Date(session.completed_at).toISOString().slice(0, 10);
        if (!weeklyProgress[week]) {
          weeklyProgress[week] = { completed: 0, total: 0 };
        }
        weeklyProgress[week].completed++;
      }

      difficultyCount[session.sub_subject.difficulty]++;
    });

    setStats({
      totalSessions,
      completedSessions,
      totalQuestions,
      correctQuestions,
      subjectPerformance: Object.entries(subjectPerformance).map(([subject, data]) => ({
        subject,
        ...(data as { questionsTotal: number; questionsCorrect: number }),
      })),
      weeklyProgress: Object.entries(weeklyProgress).map(([week, data]) => ({
        week,
        ...(data as { completed: number; total: number }),
      })),
      difficultyDistribution: Object.entries(difficultyCount).map(([difficulty, count]) => ({
        difficulty,
        count,
      })),
    });
  }, [sessions]);

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-gray-600 dark:text-gray-300">Carregando estatísticas...</div>
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center text-gray-600 dark:text-gray-300">Não há dados disponíveis</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Análise de Desempenho
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe o progresso e o desempenho do seu estudo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-médio text-gray-900 dark:text-white mb-4">
              Visão Geral
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-300">Taxa de conclusão</div>
                <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                  {stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100): 0}%
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-300">Taxa de sucesso</div>
                <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
                  {stats.totalQuestions > 0 ? Math.round((stats.correctQuestions / stats.totalQuestions) * 100) : 0}%
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 dark:text-purple-300">Total de sessões</div>
                <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                  {stats.totalSessions}
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-300">
                  Perguntas respondidas
                </div>
                <div className="text-2xl font-semibold text-orange-900 dark:text-orange-100">
                  {stats.totalQuestions}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-médio text-gray-900 dark:text-white mb-4">
              Desempenho da Matéria
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="subject" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="questionsCorrect"
                    name="Acertei"
                    fill="#10B981"
                  />
                  <Bar dataKey="questionsTotal" name="Total" fill="#6B7280" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-médio text-gray-900 dark:text-white mb-4">
              Progresso Semanal
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Sessões concluídas"
                    stroke="#6366F1"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-médio text-gray-900 dark:text-white mb-4">
              Distribuição de Dificuldade
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.difficultyDistribution}
                    dataKey="count"
                    nameKey="difficulty"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.difficultyDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}