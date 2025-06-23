import { useState } from "react";
import Layout from "../components/Layout";
import { Calendar, Code, Database, Cloud, Shield, Globe, Palette, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format, addDays } from "date-fns";
import { toast } from "react-toastify";
import { useSubjects } from "../hooks/api/useSubjects";
import { useStudySessions } from "../hooks/api/useStudySessions";
import { Box, Flex, Text, Button, Card, Switch, TextField, Checkbox } from '@radix-ui/themes';

interface SubSubject {
  id: string;
  title: string;
  difficulty: "fácil" | "médio" | "difícil";
  subject: {
    title: string;
  };
}

interface StudyDay {
  name: string;
  label: string;
  selected: boolean;
  hours: number;
}

interface Technology {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  selected: boolean;
}

export default function StudyConfig() {
  const { user } = useAuth();
  const { subjects: { data: subjectsData } } = useSubjects();
  const { createStudySession } = useStudySessions();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Study days configuration
  const [studyDays, setStudyDays] = useState<StudyDay[]>([
    { name: 'monday', label: 'Segunda', selected: false, hours: 1 },
    { name: 'tuesday', label: 'Terça', selected: false, hours: 1 },
    { name: 'wednesday', label: 'Quarta', selected: false, hours: 1 },
    { name: 'thursday', label: 'Quinta', selected: false, hours: 1 },
    { name: 'friday', label: 'Sexta', selected: false, hours: 1 },
    { name: 'saturday', label: 'Sábado', selected: false, hours: 1 },
    { name: 'sunday', label: 'Domingo', selected: false, hours: 1 },
  ]);

  // Technologies configuration
  const [technologies, setTechnologies] = useState<Technology[]>([
    { id: 'html', name: 'HTML', icon: Globe, selected: true },
    { id: 'css', name: 'CSS', icon: Palette, selected: true },
    { id: 'javascript', name: 'JavaScript', icon: Code, selected: true },
    { id: 'react', name: 'React', icon: Code, selected: true },
    { id: 'security', name: 'Segurança', icon: Shield, selected: true },
    { id: 'data', name: 'Dados', icon: Database, selected: true },
    { id: 'cloud', name: 'Cloud', icon: Cloud, selected: true },
  ]);

  const subSubjects = subjectsData?.flatMap(subject => 
    subject.sub_subjects.map(sub => ({
      ...sub,
      subject: {
        title: subject.title
      }
    }))
  ) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubjects(subSubjects.map(subject => subject.id));
    } else {
      setSelectedSubjects([]);
    }
  };

  const handleDayToggle = (dayName: string, selected: boolean) => {
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { ...day, selected } : day
    ));
  };

  const handleHoursChange = (dayName: string, hours: number) => {
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { ...day, hours: Math.max(1, Math.min(12, hours)) } : day
    ));
  };

  const handleTechnologyToggle = (techId: string, selected: boolean) => {
    setTechnologies(prev => prev.map(tech => 
      tech.id === techId ? { ...tech, selected } : tech
    ));
  };

  async function handleGenerateSchedule() {
    const selectedDays = studyDays.filter(day => day.selected);
    const selectedTechs = technologies.filter(tech => tech.selected);

    if (selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana para estudar", {
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

    if (selectedTechs.length === 0) {
      toast.error("Selecione pelo menos uma tecnologia para estudar", {
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

    if (selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos um assunto", {
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

    setLoading(true);
    try {
      const selectedSubjectsData = subSubjects.filter((sub) =>
        selectedSubjects.includes(sub.id)
      );

      const studySessions = selectedSubjectsData.flatMap((subject) => {
        const reviewDays =
          subject.difficulty === "fácil"
            ? 7
            : subject.difficulty === "médio"
            ? 5
            : 3;

        const initialSession = {
          subSubjectId: subject.id,
          scheduledDate: startDate,
        };

        const reviewSessions = Array.from({ length: 3 }, (_, index) => ({
          subSubjectId: subject.id,
          scheduledDate: format(
            addDays(new Date(startDate), reviewDays * (index + 1)),
            "yyyy-MM-dd"
          ),
        }));

        return [initialSession, ...reviewSessions];
      });

      // Create study sessions sequentially
      for (const session of studySessions) {
        await createStudySession.mutateAsync(session);
      }

      toast.success("Cronograma de estudos gerado com sucesso!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      setSelectedSubjects([]);
      setShowPreferences(true);
    } catch (error) {
      console.error("Erro ao gerar cronograma:", error);
      toast.error("Falha ao gerar cronograma de estudo", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!user?.id) {
    return (
      <Layout>
        <Box p="6">
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Text color="gray">Faça login para gerenciar suas matérias</Text>
          </Flex>
        </Box>
      </Layout>
    );
  }

  const totalHours = studyDays.filter(day => day.selected).reduce((sum, day) => sum + day.hours, 0);
  const selectedTechCount = technologies.filter(tech => tech.selected).length;

  return (
    <Layout>
      <Box p="6">
        <Box mb="6">
          <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
            Configuração do estudo
          </Text>
          <Text size="3" color="gray">
            Configure suas preferências para gerar um cronograma personalizado
          </Text>
        </Box>

        <Card size="3">
          <Box p="6">
            <Text size="5" weight="medium" mb="6" style={{ display: 'block' }}>
              Gerador de cronograma
            </Text>

            <Flex direction="column" gap="8">
              {/* Study Days Section */}
              <Box>
                <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
                  📅 Dias disponíveis para estudar
                </Text>
                <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
                  Selecione os dias da semana em que você pode estudar
                </Text>
                
                <Flex direction="column" gap="4">
                  <Flex wrap="wrap" gap="3">
                    {studyDays.map((day) => (
                      <Card 
                        key={day.name} 
                        variant={day.selected ? "solid" : "surface"}
                        style={{ 
                          cursor: 'pointer',
                          minWidth: '120px',
                          backgroundColor: day.selected ? 'var(--indigo-9)' : 'var(--gray-3)',
                          color: day.selected ? 'white' : 'var(--gray-12)'
                        }}
                        onClick={() => handleDayToggle(day.name, !day.selected)}
                      >
                        <Flex align="center" justify="center" p="3">
                          <Text size="2" weight="medium">
                            {day.label}
                          </Text>
                        </Flex>
                      </Card>
                    ))}
                  </Flex>

                  {studyDays.some(day => day.selected) && (
                    <Box>
                      <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>
                        Horas de estudo por dia:
                      </Text>
                      <Flex direction="column" gap="2">
                        {studyDays.filter(day => day.selected).map((day) => (
                          <Flex key={day.name} align="center" gap="3">
                            <Text size="2" style={{ minWidth: '80px' }}>
                              {day.label}:
                            </Text>
                            <TextField.Root
                              type="number"
                              min="1"
                              max="12"
                              value={day.hours.toString()}
                              onChange={(e) => handleHoursChange(day.name, parseInt(e.target.value) || 1)}
                              style={{ width: '80px' }}
                            />
                            <Text size="2" color="gray">
                              hora(s)
                            </Text>
                          </Flex>
                        ))}
                        <Text size="2" color="gray" mt="2">
                          Total semanal: {totalHours} hora(s)
                        </Text>
                      </Flex>
                    </Box>
                  )}
                </Flex>
              </Box>

              {/* Technologies Section */}
              <Box>
                <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
                  💻 Tecnologias para aprender
                </Text>
                <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
                  Selecione as tecnologias que deseja incluir no seu plano de estudos
                </Text>
                
                <Flex wrap="wrap" gap="3">
                  {technologies.map((tech) => {
                    const IconComponent = tech.icon;
                    return (
                      <Card 
                        key={tech.id}
                        variant={tech.selected ? "solid" : "surface"}
                        style={{ 
                          cursor: 'pointer',
                          minWidth: '140px',
                          backgroundColor: tech.selected ? 'var(--green-9)' : 'var(--gray-3)',
                          color: tech.selected ? 'white' : 'var(--gray-12)'
                        }}
                        onClick={() => handleTechnologyToggle(tech.id, !tech.selected)}
                      >
                        <Flex align="center" justify="center" gap="2" p="3">
                          <IconComponent size={16} />
                          <Text size="2" weight="medium">
                            {tech.name}
                          </Text>
                          {tech.selected && <CheckCircle size={14} />}
                        </Flex>
                      </Card>
                    );
                  })}
                </Flex>
                <Text size="2" color="gray" mt="3">
                  {selectedTechCount} tecnologia(s) selecionada(s)
                </Text>
              </Box>

              {/* Start Date Section */}
              <Box>
                <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
                  📆 Data de início
                </Text>
                <TextField.Root
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
              </Box>

              {/* Subject Selection */}
              <Box>
                <Flex justify="between" align="center" mb="4">
                  <Text size="4" weight="medium">
                    📚 Matérias para estudar
                  </Text>
                  <Flex align="center" gap="2">
                    <Checkbox
                      checked={selectedSubjects.length === subSubjects.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <Text size="2" color="gray">
                      Selecionar todas
                    </Text>
                  </Flex>
                </Flex>
                
                <Box style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <Flex direction="column" gap="2">
                    {subSubjects.map((subject) => (
                      <Card 
                        key={subject.id}
                        variant="surface"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (selectedSubjects.includes(subject.id)) {
                            setSelectedSubjects(prev => prev.filter(id => id !== subject.id));
                          } else {
                            setSelectedSubjects(prev => [...prev, subject.id]);
                          }
                        }}
                      >
                        <Flex align="center" gap="3" p="3">
                          <Checkbox
                            checked={selectedSubjects.includes(subject.id)}
                            onCheckedChange={() => {}}
                          />
                          <Flex direction="column" flexGrow="1">
                            <Text size="3" weight="medium">
                              {subject.title}
                            </Text>
                            <Text size="2" color="gray">
                              {subject.subject.title} • {subject.difficulty}
                            </Text>
                          </Flex>
                          <Box
                            style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'medium',
                              backgroundColor: 
                                subject.difficulty === "fácil" ? 'var(--blue-3)' :
                                subject.difficulty === "médio" ? 'var(--yellow-3)' :
                                'var(--red-3)',
                              color:
                                subject.difficulty === "fácil" ? 'var(--blue-11)' :
                                subject.difficulty === "médio" ? 'var(--yellow-11)' :
                                'var(--red-11)'
                            }}
                          >
                            {subject.difficulty === "fácil"
                              ? "Revisão em 7 dias"
                              : subject.difficulty === "médio"
                              ? "Revisão em 5 dias"
                              : "Revisão em 3 dias"}
                          </Box>
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Flex gap="3" justify="end">
                {showPreferences && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPreferences(false)}
                  >
                    Editar preferências
                  </Button>
                )}
                <Button
                  onClick={handleGenerateSchedule}
                  disabled={loading || selectedSubjects.length === 0}
                  size="3"
                >
                  <Calendar size={16} />
                  {loading ? "Gerando cronograma..." : "Gerar Cronograma"}
                </Button>
              </Flex>
            </Flex>
          </Box>

          {/* Information Section */}
          <Box p="6" style={{ backgroundColor: 'var(--gray-2)', borderTop: '1px solid var(--gray-6)' }}>
            <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
              ℹ️ Como funciona o cronograma de estudos?
            </Text>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray">
                • Tópicos com nível fácil são revisados a cada 7 dias
              </Text>
              <Text size="2" color="gray">
                • Tópicos com nível médio são revisados a cada 5 dias
              </Text>
              <Text size="2" color="gray">
                • Tópicos com nível difícil são revisados a cada 3 dias
              </Text>
              <Text size="2" color="gray">
                • Cada tópico tem 3 sessões de revisão agendadas automaticamente
              </Text>
              <Text size="2" color="gray">
                • Você pode marcar tópicos como concluídos no calendário
              </Text>
              <Text size="2" color="gray">
                • Acompanhe seu progresso e desempenho na página Performance
              </Text>
            </Flex>
          </Box>
        </Card>
      </Box>
    </Layout>
  );
}