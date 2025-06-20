import { useEffect, useState } from "react";
import { Box, Flex, Text, Card, Grid } from '@radix-ui/themes';
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
  const { studySessions: { data: sessions, isLoading, error } } = useStudySessions();
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
        <Box p="6">
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Text>Carregando estatísticas...</Text>
          </Flex>
        </Box>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <Box p="6">
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Text color="red">Não há dados disponíveis</Text>
          </Flex>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box p="6">
        <Box mb="6">
          <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
            Análise de Desempenho
          </Text>
          <Text size="3" color="gray">
            Acompanhe o progresso e o desempenho do seu estudo
          </Text>
        </Box>

        <Grid columns={{ initial: "1", md: "2" }} gap="6">
          {/* Overview Stats */}
          <Card size="3">
            <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
              Visão Geral
            </Text>
            <Grid columns="2" gap="4">
              <Box p="4" style={{ backgroundColor: 'var(--blue-3)', borderRadius: '8px' }}>
                <Text size="2" color="blue" style={{ display: 'block' }}>Taxa de conclusão</Text>
                <Text size="6" weight="bold" style={{ color: 'var(--blue-11)' }}>
                  {stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
                </Text>
              </Box>
              <Box p="4" style={{ backgroundColor: 'var(--green-3)', borderRadius: '8px' }}>
                <Text size="2" color="green" style={{ display: 'block' }}>Taxa de sucesso</Text>
                <Text size="6" weight="bold" style={{ color: 'var(--green-11)' }}>
                  {stats.totalQuestions > 0 ? Math.round((stats.correctQuestions / stats.totalQuestions) * 100) : 0}%
                </Text>
              </Box>
              <Box p="4" style={{ backgroundColor: 'var(--purple-3)', borderRadius: '8px' }}>
                <Text size="2" color="purple" style={{ display: 'block' }}>Total de sessões</Text>
                <Text size="6" weight="bold" style={{ color: 'var(--purple-11)' }}>
                  {stats.totalSessions}
                </Text>
              </Box>
              <Box p="4" style={{ backgroundColor: 'var(--orange-3)', borderRadius: '8px' }}>
                <Text size="2" color="orange" style={{ display: 'block' }}>Perguntas respondidas</Text>
                <Text size="6" weight="bold" style={{ color: 'var(--orange-11)' }}>
                  {stats.totalQuestions}
                </Text>
              </Box>
            </Grid>
          </Card>

          {/* Subject Performance Chart */}
          <Card size="3">
            <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
              Desempenho da Matéria
            </Text>
            <Box style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
                  <XAxis 
                    dataKey="subject" 
                    stroke="var(--gray-11)" 
                    fontSize={12}
                    tick={{ fill: 'var(--gray-11)' }}
                  />
                  <YAxis 
                    stroke="var(--gray-11)" 
                    fontSize={12}
                    tick={{ fill: 'var(--gray-11)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-6)',
                      borderRadius: '6px',
                      color: 'var(--gray-12)'
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="questionsCorrect"
                    name="Acertos"
                    fill="var(--green-9)"
                  />
                  <Bar 
                    dataKey="questionsTotal" 
                    name="Total" 
                    fill="var(--gray-8)" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Weekly Progress Chart */}
          <Card size="3">
            <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
              Progresso Semanal
            </Text>
            <Box style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
                  <XAxis 
                    dataKey="week" 
                    stroke="var(--gray-11)" 
                    fontSize={12}
                    tick={{ fill: 'var(--gray-11)' }}
                  />
                  <YAxis 
                    stroke="var(--gray-11)" 
                    fontSize={12}
                    tick={{ fill: 'var(--gray-11)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-6)',
                      borderRadius: '6px',
                      color: 'var(--gray-12)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Sessões concluídas"
                    stroke="var(--indigo-9)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--indigo-9)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Difficulty Distribution Chart */}
          <Card size="3">
            <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
              Distribuição de Dificuldade
            </Text>
            <Box style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.difficultyDistribution}
                    dataKey="count"
                    nameKey="difficulty"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ difficulty, count }) => `${difficulty}: ${count}`}
                    labelLine={false}
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
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-6)',
                      borderRadius: '6px',
                      color: 'var(--gray-12)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Box>
    </Layout>
  );
}