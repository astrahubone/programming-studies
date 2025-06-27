import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Calendar, CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useTechnologies } from "../hooks/api/useTechnologies";
import { useStudyConfig } from "../hooks/api/useStudyConfig";
import { getTechnologyIcon } from "../utils/technologyIcons";
import { Box, Flex, Text, Button, Card, TextField, Checkbox, Select } from '@radix-ui/themes';
import React from "react";

interface StudyDay {
  name: string;
  label: string;
  selected: boolean;
  hours: string;
  dayIndex: number;
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
  const { technologies: { data: technologiesData, isLoading: technologiesLoading } } = useTechnologies();
  const { 
    studyConfig: { data: existingConfig, isLoading: configLoading },
    createStudyConfig,
    updateStudyConfig,
    generateSchedule
  } = useStudyConfig();
  
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // Load existing configuration
  useEffect(() => {
    if (existingConfig && !isEditing) {
      setStartDate(existingConfig.start_date);
      
      // Load study days
      const configStudyDays = existingConfig.study_days || [];
      setStudyDays(prev => prev.map(day => {
        const configDay = configStudyDays.find((cd: any) => cd.day === day.name);
        if (configDay) {
          return {
            ...day,
            selected: true,
            hours: `${configDay.hours.toString().padStart(2, '0')}:00`
          };
        }
        return { ...day, selected: false };
      }));

      // Load selected technologies
      if (technologiesData && existingConfig.selected_technologies) {
        const mappedTechnologies = technologiesData.map(tech => ({
          id: tech.id,
          name: tech.name,
          selected: existingConfig.selected_technologies.includes(tech.id),
          total_hours: tech.total_hours,
          subtopics_count: tech.subtopics_count,
        }));
        setTechnologies(mappedTechnologies);
      }
    }
  }, [existingConfig, technologiesData, isEditing]);

  // Update technologies when data is loaded (only if no existing config)
  useEffect(() => {
    if (technologiesData && technologiesData.length > 0 && !existingConfig) {
      const mappedTechnologies = technologiesData.map(tech => ({
        id: tech.id,
        name: tech.name,
        selected: true, // All selected by default
        total_hours: tech.total_hours,
        subtopics_count: tech.subtopics_count,
      }));
      setTechnologies(mappedTechnologies);
    }
  }, [technologiesData, existingConfig]);

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

  // Validation logic
  const selectedDays = studyDays.filter(day => day.selected);
  const selectedTechs = technologies.filter(tech => tech.selected);
  const hasValidHours = selectedDays.length === 0 || selectedDays.every(day => timeToDecimal(day.hours) >= 1 && !day.hasError);

  // Button is enabled when: at least one day selected AND at least one technology selected AND valid hours
  const isFormValid = selectedDays.length > 0 && 
                     selectedTechs.length > 0 && 
                     hasValidHours;

  const selectedTechCount = technologies.filter(tech => tech.selected).length;
  const allTechnologiesSelected = selectedTechCount === technologies.length;

  async function handleSaveConfiguration() {
    if (!isFormValid) {
      if (selectedDays.length === 0) {
        toast.error("Selecione pelo menos um dia da semana para estudar");
      } else if (selectedTechs.length === 0) {
        toast.error("Selecione pelo menos uma tecnologia para estudar");
      } else if (!hasValidHours) {
        toast.error("Todos os dias selecionados devem ter pelo menos 1 hora de estudo");
      }
      return;
    }

    setLoading(true);
    try {
      const studyDaysData = selectedDays.map(day => ({
        day: day.name,
        hours: timeToDecimal(day.hours)
      }));

      const selectedTechnologyIds = selectedTechs.map(tech => tech.id);

      const configData = {
        startDate,
        studyDays: studyDaysData,
        selectedTechnologies: selectedTechnologyIds,
        generateSchedule: true
      };

      if (existingConfig && isEditing) {
        await updateStudyConfig.mutateAsync({
          id: existingConfig.id,
          data: configData
        });
        
        // Regenerate schedule
        await generateSchedule.mutateAsync(existingConfig.id);
      } else {
        await createStudyConfig.mutateAsync(configData);
      }

      setIsEditing(false);
      
      // Navigate to Calendar tab after successful generation
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!user?.id) {
    return (
      <Layout>
        <Box p="6">
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Text color="gray">Faça login para configurar seus estudos</Text>
          </Flex>
        </Box>
      </Layout>
    );
  }

  if (configLoading || technologiesLoading) {
    return (
      <Layout>
        <Box p="6">
          <Flex justify="center" align="center" style={{ height: '200px' }}>
            <Text>Carregando configurações...</Text>
          </Flex>
        </Box>
      </Layout>
    );
  }

  const totalHours = selectedDays.reduce((sum, day) => sum + timeToDecimal(day.hours), 0);
  const totalSelectedHours = selectedTechs.reduce((sum, tech) => sum + tech.total_hours, 0);

  return (
    <Layout>
      <Box p="6">
        <Box mb="6">
          <Text size="6" weight="bold" mb="1" style={{ display: 'block' }}>
            Configuração de Estudos
          </Text>
          <Text size="3" color="gray">
            {existingConfig && !isEditing 
              ? "Sua configuração atual de estudos. Clique em 'Editar' para modificar."
              : "Configure suas preferências para gerar um cronograma personalizado"
            }
          </Text>
        </Box>

        <Card size="3">
          <Box p="6">
            {existingConfig && !isEditing ? (
              // Display existing configuration
              <Box>
                <Flex justify="between" align="center" mb="6">
                  <Text size="5" weight="medium">
                    Configuração Atual
                  </Text>
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Configuração
                  </Button>
                </Flex>

                <Flex direction="column" gap="6">
                  <Box>
                    <Text size="4" weight="medium" mb="2" style={{ display: 'block' }}>
                      📅 Data de início: {format(new Date(existingConfig.start_date), 'dd/MM/yyyy')}
                    </Text>
                  </Box>

                  <Box>
                    <Text size="4" weight="medium" mb="2" style={{ display: 'block' }}>
                      📅 Dias de estudo
                    </Text>
                    <Flex wrap="wrap" gap="2">
                      {existingConfig.study_days?.map((day: any) => (
                        <Box key={day.day} p="2" style={{ 
                          backgroundColor: 'var(--indigo-3)', 
                          borderRadius: '6px',
                          border: '1px solid var(--indigo-6)'
                        }}>
                          <Text size="2" style={{ color: 'var(--indigo-11)' }}>
                            {studyDays.find(d => d.name === day.day)?.label}: {day.hours}h
                          </Text>
                        </Box>
                      ))}
                    </Flex>
                    <Text size="2" color="gray" mt="2">
                      Total semanal: {existingConfig.total_weekly_hours}h
                    </Text>
                  </Box>

                  <Box>
                    <Text size="4" weight="medium" mb="2" style={{ display: 'block' }}>
                      💻 Tecnologias selecionadas
                    </Text>
                    <Flex wrap="wrap" gap="2">
                      {technologies.filter(tech => tech.selected).map(tech => (
                        <Box key={tech.id} p="2" style={{ 
                          backgroundColor: 'var(--green-3)', 
                          borderRadius: '6px',
                          border: '1px solid var(--green-6)'
                        }}>
                          <Text size="2" style={{ color: 'var(--green-11)' }}>
                            {tech.name}: {tech.total_hours}h
                          </Text>
                        </Box>
                      ))}
                    </Flex>
                    <Text size="2" color="gray" mt="2">
                      Total de conteúdo: {existingConfig.total_selected_hours}h
                    </Text>
                  </Box>

                  <Box p="4" style={{ 
                    backgroundColor: 'var(--blue-2)', 
                    borderRadius: '8px',
                    border: '1px solid var(--blue-6)'
                  }}>
                    <Text size="3" weight="medium" style={{ color: 'var(--blue-11)' }}>
                      📊 Estimativa de conclusão: {Math.ceil(existingConfig.total_selected_hours / existingConfig.total_weekly_hours)} semanas
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ) : (
              // Configuration form
              <Box>
                <Text size="5" weight="medium" mb="6" style={{ display: 'block' }}>
                  {isEditing ? 'Editar Configuração' : 'Nova Configuração'}
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
                      ✅ {selectedTechCount} tecnologia(s) selecionada(s) • {totalSelectedHours}h de conteúdo
                    </Text>
                  </Box>

                  {/* Action Buttons */}
                  <Flex gap="3" justify="end">
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveConfiguration}
                      disabled={loading || !isFormValid}
                      size="3"
                      style={{
                        opacity: !isFormValid ? 0.5 : 1,
                        cursor: !isFormValid ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Calendar size={16} />
                      {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Configuração"}
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            )}
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
                • Cada sessão de estudo é dedicada a um subtópico específico de uma tecnologia
              </Text>
              <Text size="2" color="gray">
                • As tecnologias são estudadas na ordem de complexidade (HTML → CSS → JavaScript → etc.)
              </Text>
              <Text size="2" color="gray">
                • Os subtópicos são distribuídos respeitando a carga horária de cada um
              </Text>
              <Text size="2" color="gray">
                • Você pode marcar sessões como concluídas no calendário
              </Text>
              <Text size="2" color="gray">
                • Acompanhe seu progresso na página Performance
              </Text>
            </Flex>
          </Box>
        </Card>
      </Box>
    </Layout>
  );
}