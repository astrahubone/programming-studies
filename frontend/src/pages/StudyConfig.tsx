import { useState } from "react";
import Layout from "../components/Layout";
import { Calendar, Code, Database, Cloud, Shield, Globe, Palette, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { toast } from "react-toastify";
import { useSubjects } from "../hooks/api/useSubjects";
import { useStudySessions } from "../hooks/api/useStudySessions";
import { Box, Flex, Text, Button, Card, TextField, Checkbox } from '@radix-ui/themes';

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
  dayIndex: number; // 0 = Monday, 6 = Sunday
  hasError: boolean;
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

  // Study days configuration (Monday = 0, Sunday = 6)
  const [studyDays, setStudyDays] = useState<StudyDay[]>([
    { name: 'monday', label: 'Segunda', selected: false, hours: 1, dayIndex: 0, hasError: false },
    { name: 'tuesday', label: 'Terça', selected: false, hours: 1, dayIndex: 1, hasError: false },
    { name: 'wednesday', label: 'Quarta', selected: false, hours: 1, dayIndex: 2, hasError: false },
    { name: 'thursday', label: 'Quinta', selected: false, hours: 1, dayIndex: 3, hasError: false },
    { name: 'friday', label: 'Sexta', selected: false, hours: 1, dayIndex: 4, hasError: false },
    { name: 'saturday', label: 'Sábado', selected: false, hours: 1, dayIndex: 5, hasError: false },
    { name: 'sunday', label: 'Domingo', selected: false, hours: 1, dayIndex: 6, hasError: false },
  ]);

  // Technologies configuration - all selected by default
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

  const handleSelectAllTechnologies = (checked: boolean) => {
    setTechnologies(prev => prev.map(tech => ({ ...tech, selected: checked })));
  };

  const handleDayToggle = (dayName: string, selected: boolean) => {
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { ...day, selected } : day
    ));
  };

  const handleHoursChange = (dayName: string, value: string) => {
    const hours = parseInt(value) || 0;
    const hasError = hours < 1;
    
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { 
        ...day, 
        hours: Math.max(0, Math.min(12, hours)), 
        hasError 
      } : day
    ));
  };

  const handleTechnologyToggle = (techId: string, selected: boolean) => {
    setTechnologies(prev => prev.map(tech => 
      tech.id === techId ? { ...tech, selected } : tech
    ));
  };

  // Validation logic - Fixed
  const selectedDays = studyDays.filter(day => day.selected);
  const selectedTechs = technologies.filter(tech => tech.selected);
  const hasValidHours = selectedDays.length === 0 || selectedDays.every(day => day.hours >= 1 && !day.hasError);

  const isFormValid = selectedDays.length > 0 && 
                     selectedTechs.length > 0 && 
                     hasValidHours &&
                     selectedSubjects.length > 0;

  // Technology select all state
  const allTechsSelected = technologies.every(tech => tech.selected);
  const someTechsSelected = technologies.some(tech => tech.selected);
  const techSelectAllState = allTechsSelected ? true : (someTechsSelected ? 'indeterminate' : false);

  async function handleGenerateSchedule() {
    if (!isFormValid) {
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
      } else if (selectedTechs.length === 0) {
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
      } else if (!hasValidHours) {
        toast.error("Todos os dias selecionados devem ter pelo menos 1 hora de estudo", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } else if (selectedSubjects.length === 0) {
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
      }
      return;
    }

    setLoading(true);
    try {
      // Create study sessions based on selected days, hours, and technologies
      const studySessions = [];
      const selectedSubjectsData = subSubjects.filter((sub) =>
        selectedSubjects.includes(sub.id)
      );

      // Calculate total hours per week
      const totalWeeklyHours = selectedDays.reduce((sum, day) => sum + day.hours, 0);
      
      // Create a schedule for 4 weeks
      for (let week = 0; week < 4; week++) {
        const weekStart = startOfWeek(addWeeks(new Date(startDate), week), { weekStartsOn: 1 }); // Monday start
        
        selectedDays.forEach(day => {
          const dayDate = addDays(weekStart, day.dayIndex);
          
          // For each hour on this day, assign a technology/subject
          for (let hour = 0; hour < day.hours; hour++) {
            // Cycle through selected technologies
            const techIndex = (week * totalWeeklyHours + selectedDays.indexOf(day) * day.hours + hour) % selectedTechs.length;
            const selectedTech = selectedTechs[techIndex];
            
            // Find a subject that matches this technology (or use first available)
            const matchingSubject = selectedSubjectsData.find(sub => 
              sub.title.toLowerCase().includes(selectedTech.name.toLowerCase()) ||
              sub.subject.title.toLowerCase().includes(selectedTech.name.toLowerCase())
            ) || selectedSubjectsData[0];

            if (matchingSubject) {
              studySessions.push({
                subSubjectId: matchingSubject.id,
                scheduledDate: format(dayDate, "yyyy-MM-dd"),
              });
            }
          }
        });
      }

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

  const totalHours = selectedDays.reduce((sum, day) => sum + day.hours, 0);
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
                          color: day.selected ? 'white' : 'var(--gray-12)',
                          border: day.selected ? '2px solid var(--indigo-11)' : '1px solid var(--gray-6)'
                        }}
                        onClick={() => handleDayToggle(day.name, !day.selected)}
                      >
                        <Flex align="center" justify="center" p="3">
                          <Text size="2" weight="medium">
                            {day.label}
                          </Text>
                          {day.selected && <CheckCircle size={16} style={{ marginLeft: '8px' }} />}
                        </Flex>
                      </Card>
                    ))}
                  </Flex>

                  {selectedDays.length > 0 && (
                    <Box>
                      <Text size="3" weight="medium" mb="3" style={{ display: 'block' }}>
                        Horas de estudo por dia:
                      </Text>
                      <Flex direction="column" gap="3">
                        {selectedDays.map((day) => (
                          <Box key={day.name}>
                            <Flex align="center" gap="3">
                              <Text size="2" style={{ minWidth: '80px' }}>
                                {day.label}:
                              </Text>
                              <TextField.Root
                                type="number"
                                min="1"
                                max="12"
                                value={day.hours.toString()}
                                onChange={(e) => handleHoursChange(day.name, e.target.value)}
                                style={{ 
                                  width: '80px',
                                  borderColor: day.hasError ? 'var(--red-8)' : undefined
                                }}
                                color={day.hasError ? "red" : undefined}
                              />
                              <Text size="2" color="gray">
                                hora(s)
                              </Text>
                            </Flex>
                            {day.hasError && (
                              <Text size="1" color="red" mt="1" style={{ marginLeft: '83px' }}>
                                O valor mínimo deve ser 1 hora.
                              </Text>
                            )}
                          </Box>
                        ))}
                        <Text size="2" color="gray" mt="2" style={{ 
                          padding: '8px 12px', 
                          backgroundColor: 'var(--blue-3)', 
                          borderRadius: '6px',
                          color: 'var(--blue-11)'
                        }}>
                          📊 Total semanal: {totalHours} hora(s)
                        </Text>
                      </Flex>
                    </Box>
                  )}
                </Flex>
              </Box>

              {/* Technologies Section */}
              <Box>
                <Flex justify="between" align="center" mb="4">
                  <Text size="4" weight="medium">
                    💻 Tecnologias que deseja estudar
                  </Text>
                  <Flex align="center" gap="2">
                    <Checkbox
                      checked={techSelectAllState}
                      onCheckedChange={(checked) => handleSelectAllTechnologies(!!checked)}
                    />
                    <Text size="2" color="gray">
                      Selecionar todas
                    </Text>
                  </Flex>
                </Flex>
                <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
                  Todas as tecnologias estão selecionadas por padrão. Desmarque as que você já domina ou não deseja estudar.
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
                          color: tech.selected ? 'white' : 'var(--gray-12)',
                          border: tech.selected ? '2px solid var(--green-11)' : '1px solid var(--gray-6)'
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
                <Text size="2" color="gray" mt="3" style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'var(--green-3)', 
                  borderRadius: '6px',
                  color: 'var(--green-11)'
                }}>
                  ✅ {selectedTechCount} tecnologia(s) selecionada(s)
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
                      checked={selectedSubjects.length === subSubjects.length && subSubjects.length > 0}
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
                        style={{ 
                          cursor: 'pointer',
                          border: selectedSubjects.includes(subject.id) ? '2px solid var(--indigo-9)' : '1px solid var(--gray-6)'
                        }}
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
                  disabled={loading || !isFormValid}
                  size="3"
                  style={{
                    opacity: !isFormValid ? 0.5 : 1,
                    cursor: !isFormValid ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Calendar size={16} />
                  {loading ? "Gerando cronograma..." : "Gerar Cronograma"}
                </Button>
              </Flex>

              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <Box p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: '6px', fontSize: '12px' }}>
                  <Text size="1" color="gray">
                    Debug: Days: {selectedDays.length} | Techs: {selectedTechs.length} | Valid Hours: {hasValidHours.toString()} | Subjects: {selectedSubjects.length} | Valid: {isFormValid.toString()}
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>

          {/* Information Section */}
          <Box p="6" style={{ backgroundColor: 'var(--gray-2)', borderTop: '1px solid var(--gray-6)' }}>
            <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
              ℹ️ Como funciona o cronograma de estudos?
            </Text>
            <Flex direction="column" gap="2">
              <Text size="2" color="gray">
                • O sistema distribui as tecnologias selecionadas ao longo dos dias e horas escolhidos
              </Text>
              <Text size="2" color="gray">
                • Cada hora de estudo é dedicada a uma tecnologia específica
              </Text>
              <Text size="2" color="gray">
                • O cronograma é gerado para 4 semanas consecutivas
              </Text>
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