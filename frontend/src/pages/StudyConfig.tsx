import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Calendar, CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { toast } from "react-toastify";
import { useSubjects } from "../hooks/api/useSubjects";
import { useStudySessions } from "../hooks/api/useStudySessions";
import { useTechnologies } from "../hooks/api/useTechnologies";
import { getTechnologyIcon } from "../utils/technologyIcons";
import { Box, Flex, Text, Button, Card, TextField, Checkbox, Select } from '@radix-ui/themes';

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
  hours: string; // Changed to string to handle "01:00" format
  dayIndex: number; // 0 = Monday, 6 = Sunday
  hasError: boolean;
}

interface Technology {
  id: string;
  name: string;
  selected: boolean;
  total_hours: number;
  subtopics_count: number;
}

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hours = 1; hours <= 12; hours++) {
    options.push({
      value: `${hours.toString().padStart(2, '0')}:00`,
      label: `${hours.toString().padStart(2, '0')}:00`
    });
    if (hours < 12) {
      options.push({
        value: `${hours.toString().padStart(2, '0')}:30`,
        label: `${hours.toString().padStart(2, '0')}:30`
      });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export default function StudyConfig() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subjects: { data: subjectsData } } = useSubjects();
  const { createStudySession } = useStudySessions();
  const { technologies: { data: technologiesData, isLoading: technologiesLoading } } = useTechnologies();
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Study days configuration (Monday = 0, Sunday = 6)
  const [studyDays, setStudyDays] = useState<StudyDay[]>([
    { name: 'monday', label: 'Segunda', selected: false, hours: '01:00', dayIndex: 0, hasError: false },
    { name: 'tuesday', label: 'Terça', selected: false, hours: '01:00', dayIndex: 1, hasError: false },
    { name: 'wednesday', label: 'Quarta', selected: false, hours: '01:00', dayIndex: 2, hasError: false },
    { name: 'thursday', label: 'Quinta', selected: false, hours: '01:00', dayIndex: 3, hasError: false },
    { name: 'friday', label: 'Sexta', selected: false, hours: '01:00', dayIndex: 4, hasError: false },
    { name: 'saturday', label: 'Sábado', selected: false, hours: '01:00', dayIndex: 5, hasError: false },
    { name: 'sunday', label: 'Domingo', selected: false, hours: '01:00', dayIndex: 6, hasError: false },
  ]);

  // Technologies configuration - all selected by default, populated from API
  const [technologies, setTechnologies] = useState<Technology[]>([]);

  // Update technologies when data is loaded
  React.useEffect(() => {
    if (technologiesData && technologiesData.length > 0) {
      const mappedTechnologies = technologiesData.map(tech => ({
        id: tech.id,
        name: tech.name,
        selected: true, // All selected by default
        total_hours: tech.total_hours,
        subtopics_count: tech.subtopics_count,
      }));
      setTechnologies(mappedTechnologies);
    }
  }, [technologiesData]);

  console.log(technologies, 'technologies')

  const subSubjects = subjectsData?.flatMap(subject => 
    subject.sub_subjects.map(sub => ({
      ...sub,
      subject: {
        title: subject.title
      }
    }))
  ) || [];

  const handleSelectAllTechnologies = (checked: boolean) => {
    setTechnologies(prev => prev.map(tech => ({ ...tech, selected: checked })));
  };

  const handleDayToggle = (dayName: string, selected: boolean) => {
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { ...day, selected } : day
    ));
  };

  const handleHoursChange = (dayName: string, value: string) => {
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { 
        ...day, 
        hours: value,
        hasError: false
      } : day
    ));
  };

  const handleRemoveDay = (dayName: string) => {
    setStudyDays(prev => prev.map(day => 
      day.name === dayName ? { ...day, selected: false } : day
    ));
  };

  const handleTechnologyToggle = (techId: string, selected: boolean) => {
    setTechnologies(prev => prev.map(tech => 
      tech.id === techId ? { ...tech, selected } : tech
    ));
  };

  // Convert time string to decimal hours for calculations
  const timeToDecimal = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  };

  // Fixed validation logic - only check days and technologies
  const selectedDays = studyDays.filter(day => day.selected);
  const selectedTechs = technologies.filter(tech => tech.selected);
  const hasValidHours = selectedDays.length === 0 || selectedDays.every(day => timeToDecimal(day.hours) >= 1 && !day.hasError);

  // Button is enabled when: at least one day selected AND at least one technology selected AND valid hours
  const isFormValid = selectedDays.length > 0 && 
                     selectedTechs.length > 0 && 
                     hasValidHours;

  const selectedTechCount = technologies.filter(tech => tech.selected).length;
  const allTechnologiesSelected = selectedTechCount === technologies.length;

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
      }
      return;
    }

    setLoading(true);
    try {
      // Create study sessions based on selected days, hours, and technologies
      const studySessions = [];

      // Use all available subjects if any exist
      const availableSubjects = subSubjects.length > 0 ? subSubjects : [];

      // Calculate total hours per week
      const totalWeeklyHours = selectedDays.reduce((sum, day) => sum + timeToDecimal(day.hours), 0);
      
      // Create a schedule starting from the selected start date for 4 weeks
      for (let week = 0; week < 4; week++) {
        const weekStart = startOfWeek(addWeeks(new Date(startDate), week), { weekStartsOn: 1 }); // Monday start
        
        selectedDays.forEach(day => {
          const dayDate = addDays(weekStart, day.dayIndex);
          const dayHours = timeToDecimal(day.hours);
          
          // For each hour on this day, assign a technology/subject
          for (let hour = 0; hour < Math.floor(dayHours); hour++) {
            // Cycle through selected technologies
            const techIndex = (week * totalWeeklyHours + selectedDays.indexOf(day) * dayHours + hour) % selectedTechs.length;
            const selectedTech = selectedTechs[techIndex];
            
            // Find a subject that matches this technology (or use first available)
            let matchingSubject = null;
            if (availableSubjects.length > 0) {
              matchingSubject = availableSubjects.find(sub => 
                sub.title.toLowerCase().includes(selectedTech.name.toLowerCase()) ||
                sub.subject.title.toLowerCase().includes(selectedTech.name.toLowerCase())
              ) || availableSubjects[0];
            }

            if (matchingSubject) {
              studySessions.push({
                subSubjectId: matchingSubject.id,
                scheduledDate: format(dayDate, "yyyy-MM-dd"),
              });
            }
          }
        });
      }

      // Only create sessions if we have subjects to work with
      if (studySessions.length > 0) {
        // Create study sessions sequentially
        for (const session of studySessions) {
          await createStudySession.mutateAsync(session);
        }
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
      
      // Clear form state
      setShowPreferences(true);
      
      // Navigate to Calendar tab after successful generation
      navigate('/dashboard');
      
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

  const totalHours = selectedDays.reduce((sum, day) => sum + timeToDecimal(day.hours), 0);

  return (
    <Layout>
      <Box p="6">
        <Box mb="6">
          <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
            Configuração do estudos
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
              {/* Start Date Section */}
              <Box>
                <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
                  📅 Data de início
                </Text>
                <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
                  Escolha quando você deseja começar seu cronograma de estudos
                </Text>
                <TextField.Root
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
              </Box>

              {/* Study Days Section */}
              <Box>
                <Text size="4" weight="medium" mb="4" style={{ display: 'block' }}>
                  📅 Dias disponíveis para estudar
                </Text>
                <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
                  Clique nos dias da semana para selecioná-los
                </Text>
                
                <Flex direction="column" gap="4">
                  <Flex wrap="wrap" gap="3">
                    {studyDays.map((day) => (
                      <Card 
                        key={day.name} 
                        variant="surface"
                        style={{ 
                          cursor: 'pointer',
                          minWidth: '120px',
                          border: day.selected ? '2px solid var(--indigo-9)' : '2px solid var(--gray-6)',
                          backgroundColor: day.selected ? 'var(--indigo-3)' : 'var(--gray-2)'
                        }}
                        onClick={() => handleDayToggle(day.name, !day.selected)}
                      >
                        <Flex align="center" justify="center" gap="2" p="3">
                          <Box
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid var(--gray-8)',
                              borderRadius: '3px',
                              backgroundColor: day.selected ? 'var(--indigo-9)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {day.selected && <CheckCircle size={12} color="white" />}
                          </Box>
                          <Text size="2" weight="medium" style={{ color: day.selected ? 'var(--indigo-11)' : 'var(--gray-11)' }}>
                            {day.label}
                          </Text>
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
                              <Select.Root
                                value={day.hours}
                                onValueChange={(value) => handleHoursChange(day.name, value)}
                              >
                                <Select.Trigger style={{ width: '120px' }} />
                                <Select.Content>
                                  {timeOptions.map((option) => (
                                    <Select.Item key={option.value} value={option.value}>
                                      {option.label}
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Root>
                              <Button
                                variant="ghost"
                                color="red"
                                size="1"
                                onClick={() => handleRemoveDay(day.name)}
                                style={{ cursor: 'pointer' }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </Flex>
                          </Box>
                        ))}
                        <Text size="2" color="gray" mt="2" style={{ 
                          padding: '8px 12px', 
                          backgroundColor: 'var(--blue-3)', 
                          borderRadius: '6px',
                          color: 'var(--blue-11)'
                        }}>
                          📊 Total semanal: {totalHours.toFixed(1)} hora(s)
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
                      checked={allTechnologiesSelected}
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
                
                {technologiesLoading ? (
                  <Flex justify="center" align="center" p="4">
                    <Text>Carregando tecnologias...</Text>
                  </Flex>
                ) : (
                  <Flex wrap="wrap" gap="3">
                    {technologies.map((tech) => {
                      const IconComponent = getTechnologyIcon(tech.name);
                      return (
                        <Card 
                          key={tech.id}
                          variant={tech.selected ? "solid" : "surface"}
                          style={{ 
                            cursor: 'pointer',
                            minWidth: '160px',
                            backgroundColor: tech.selected ? 'var(--green-9)' : 'var(--gray-3)',
                            color: tech.selected ? 'white' : 'var(--gray-12)',
                            border: tech.selected ? '2px solid var(--green-11)' : '1px solid var(--gray-6)'
                          }}
                          onClick={() => handleTechnologyToggle(tech.id, !tech.selected)}
                        >
                          <Flex direction="column" gap="2" p="3">
                            <Flex align="center" justify="center" gap="2">
                              <IconComponent size={16} />
                              <Text size="2" weight="medium">
                                {tech.name}
                              </Text>
                              {tech.selected && <CheckCircle size={14} />}
                            </Flex>
                            <Text size="1" style={{ 
                              textAlign: 'center',
                              opacity: 0.8,
                              color: tech.selected ? 'white' : 'var(--gray-11)'
                            }}>
                              {tech.total_hours}h • {tech.subtopics_count} tópicos
                            </Text>
                          </Flex>
                        </Card>
                      );
                    })}
                  </Flex>
                )}
                
                <Text size="2" color="gray" mt="3" style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'var(--green-3)', 
                  borderRadius: '6px',
                  color: 'var(--green-11)'
                }}>
                  ✅ {selectedTechCount} tecnologia(s) selecionada(s)
                </Text>
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
                • O cronograma é gerado para 4 semanas consecutivas a partir da data escolhida
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