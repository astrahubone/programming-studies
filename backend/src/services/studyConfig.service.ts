import { supabase } from '../config/supabase.js';

interface StudyDay {
  day: string;
  hours: number;
}

interface CreateStudyConfigData {
  startDate: string;
  studyDays: StudyDay[];
  selectedTechnologies: string[];
  generateSchedule?: boolean;
}

interface StudySessionFilters {
  startDate?: string;
  endDate?: string;
  technologyId?: string;
  completed?: boolean;
  page?: number;
  limit?: number;
}

interface CalendarFilters {
  startDate?: string;
  endDate?: string;
}

export class StudyConfigService {
  async getUserStudyConfig(userId: string) {
    const { data, error } = await supabase
      .from('study_configurations')
      .select(`
        *,
        sessions_count:technology_study_sessions(count),
        completed_sessions_count:technology_study_sessions(count).eq(is_completed, true)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  async createStudyConfig(userId: string, data: CreateStudyConfigData) {
    // Calcular total de horas semanais
    const totalWeeklyHours = data.studyDays.reduce((sum, day) => sum + day.hours, 0);

    // Buscar total de horas das tecnologias selecionadas
    const { data: technologies, error: techError } = await supabase
      .from('technologies_with_hours')
      .select('total_hours')
      .in('id', data.selectedTechnologies);

    if (techError) throw techError;

    const totalSelectedHours = technologies?.reduce((sum, tech) => sum + (tech.total_hours || 0), 0) || 0;

    // Desativar configuração anterior se existir
    await supabase
      .from('study_configurations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Criar nova configuração
    const { data: config, error } = await supabase
      .from('study_configurations')
      .insert({
        user_id: userId,
        start_date: data.startDate,
        study_days: data.studyDays,
        selected_technologies: data.selectedTechnologies,
        total_weekly_hours: totalWeeklyHours,
        total_selected_hours: totalSelectedHours,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Study config creation error:', error);
      throw new Error('Failed to create study configuration');
    }

    // Gerar cronograma se solicitado
    if (data.generateSchedule) {
      try {
        await this.generateStudySchedule(userId, config.id);
      } catch (scheduleError) {
        console.error('Error generating schedule:', scheduleError);
        // Não falhar a criação da configuração se o cronograma falhar
      }
    }

    return config;
  }

  async updateStudyConfig(userId: string, configId: string, updates: Partial<CreateStudyConfigData>) {
    // Verificar se a configuração pertence ao usuário
    const { data: existingConfig, error: checkError } = await supabase
      .from('study_configurations')
      .select('id')
      .eq('id', configId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingConfig) {
      return null;
    }

    // Recalcular totais se necessário
    const updateData: any = { ...updates };

    if (updates.studyDays) {
      updateData.total_weekly_hours = updates.studyDays.reduce((sum, day) => sum + day.hours, 0);
    }

    if (updates.selectedTechnologies) {
      const { data: technologies, error: techError } = await supabase
        .from('technologies_with_hours')
        .select('total_hours')
        .in('id', updates.selectedTechnologies);

      if (techError) throw techError;

      updateData.total_selected_hours = technologies?.reduce((sum, tech) => sum + (tech.total_hours || 0), 0) || 0;
    }

    const { data, error } = await supabase
      .from('study_configurations')
      .update(updateData)
      .eq('id', configId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStudyConfig(userId: string, configId: string) {
    // Soft delete - marcar como inativo
    const { error } = await supabase
      .from('study_configurations')
      .update({ is_active: false })
      .eq('id', configId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async resetStudySchedule(userId: string) {
    try {
      console.log(`Starting study schedule reset for user: ${userId}`);

      // 1. Buscar todas as configurações ativas do usuário
      const { data: activeConfigs, error: configError } = await supabase
        .from('study_configurations')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (configError) {
        console.error('Error fetching active configs:', configError);
        throw configError;
      }

      const configIds = activeConfigs?.map(config => config.id) || [];
      console.log(`Found ${configIds.length} active configurations`);

      // 2. Deletar todas as sessões de estudo do usuário
      const { data: deletedSessions, error: deleteSessionsError } = await supabase
        .from('technology_study_sessions')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (deleteSessionsError) {
        console.error('Error deleting study sessions:', deleteSessionsError);
        throw deleteSessionsError;
      }

      const deletedSessionsCount = deletedSessions?.length || 0;
      console.log(`Deleted ${deletedSessionsCount} study sessions`);

      // 3. Desativar todas as configurações de estudo do usuário
      const { data: deactivatedConfigs, error: deactivateError } = await supabase
        .from('study_configurations')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select('id');

      if (deactivateError) {
        console.error('Error deactivating configs:', deactivateError);
        throw deactivateError;
      }

      const deactivatedConfigsCount = deactivatedConfigs?.length || 0;
      console.log(`Deactivated ${deactivatedConfigsCount} study configurations`);

      const result = {
        deletedSessions: deletedSessionsCount,
        deactivatedConfigurations: deactivatedConfigsCount,
        resetDate: new Date().toISOString()
      };

      console.log('Study schedule reset completed successfully:', result);
      return result;

    } catch (error) {
      console.error('Error in resetStudySchedule:', error);
      throw new Error(`Failed to reset study schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateStudySchedule(userId: string, configId: string) {
    // Chamar a função do banco de dados para gerar o cronograma
    const { data, error } = await supabase
      .rpc('generate_study_schedule', {
        p_user_id: userId,
        p_configuration_id: configId
      });

    if (error) {
      console.error('Generate schedule error:', error);
      throw new Error('Failed to generate study schedule');
    }

    return data || [];
  }

  async getStudySchedule(userId: string, configId: string, filters: StudySessionFilters = {}) {
    let query = supabase
      .from('technology_study_sessions')
      .select(`
        *,
        technology:technologies(id, name, icon_name),
        subtopic:technology_subtopics(id, name, difficulty_level, hours_required)
      `)
      .eq('user_id', userId)
      .eq('configuration_id', configId)
      .order('scheduled_date', { ascending: true });

    if (filters.startDate) {
      query = query.gte('scheduled_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('scheduled_date', filters.endDate);
    }

    if (filters.completed !== undefined) {
      query = query.eq('is_completed', filters.completed);
    }

    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getStudyStats(userId: string, configId: string) {
    const { data, error } = await supabase
      .from('study_configuration_stats')
      .select('*')
      .eq('id', configId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserStudySessions(userId: string, filters: StudySessionFilters = {}) {
    let query = supabase
      .from('technology_study_sessions')
      .select(`
        *,
        technology:technologies(id, name, icon_name),
        subtopic:technology_subtopics(id, name, difficulty_level, hours_required),
        configuration:study_configurations(id, start_date)
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (filters.startDate) {
      query = query.gte('scheduled_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('scheduled_date', filters.endDate);
    }

    if (filters.technologyId) {
      query = query.eq('technology_id', filters.technologyId);
    }

    if (filters.completed !== undefined) {
      query = query.eq('is_completed', filters.completed);
    }

    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getStudySessionsForCalendar(userId: string, filters: CalendarFilters = {}) {
    let query = supabase
      .from('technology_study_sessions')
      .select(`
        id,
        scheduled_date,
        scheduled_hours,
        is_completed,
        completed_at,
        technology:technologies(id, name, icon_name),
        subtopic:technology_subtopics(id, name, difficulty_level)
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (filters.startDate) {
      query = query.gte('scheduled_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('scheduled_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatar para o calendário
    return data?.map(session => ({
      id: session.id,
      title: `${session.technology?.name} - ${session.subtopic?.name}`,
      date: session.scheduled_date,
      backgroundColor: session.is_completed ? '#10B981' : this.getDifficultyColor(session.subtopic?.difficulty_level),
      borderColor: 'transparent',
      extendedProps: {
        completed: session.is_completed,
        difficulty: session.subtopic?.difficulty_level,
        technology: session.technology?.name,
        subtopic: session.subtopic?.name,
        hours: session.scheduled_hours,
        session: session
      }
    })) || [];
  }

  private getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'iniciante': return '#60A5FA';
      case 'intermediario': return '#F59E0B';
      case 'avancado': return '#EF4444';
      default: return '#60A5FA';
    }
  }

  async completeStudySession(userId: string, sessionId: string, notes?: string) {
    const { data, error } = await supabase
      .from('technology_study_sessions')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select(`
        *,
        technology:technologies(id, name, icon_name),
        subtopic:technology_subtopics(id, name, difficulty_level, hours_required)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateStudySession(userId: string, sessionId: string, updates: any) {
    const { data, error } = await supabase
      .from('technology_study_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select(`
        *,
        technology:technologies(id, name, icon_name),
        subtopic:technology_subtopics(id, name, difficulty_level, hours_required)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStudySession(userId: string, sessionId: string) {
    const { error } = await supabase
      .from('technology_study_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async bulkCompleteStudySessions(userId: string, sessionIds: string[], notes?: string) {
    const { data, error } = await supabase
      .from('technology_study_sessions')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('user_id', userId)
      .in('id', sessionIds)
      .select('id');

    if (error) throw error;

    return {
      message: 'Study sessions completed successfully',
      completedCount: data?.length || 0,
      sessionIds: data?.map(s => s.id) || []
    };
  }

  async bulkDeleteStudySessions(userId: string, sessionIds: string[]) {
    const { data, error } = await supabase
      .from('technology_study_sessions')
      .delete()
      .eq('user_id', userId)
      .in('id', sessionIds)
      .select('id');

    if (error) throw error;

    return {
      message: 'Study sessions deleted successfully',
      deletedCount: data?.length || 0,
      sessionIds: data?.map(s => s.id) || []
    };
  }

  async getTechnologyProgress(userId: string, technologyId: string) {
    // Buscar progresso de uma tecnologia específica
    const { data: sessions, error } = await supabase
      .from('technology_study_sessions')
      .select(`
        *,
        subtopic:technology_subtopics(id, name, hours_required, difficulty_level)
      `)
      .eq('user_id', userId)
      .eq('technology_id', technologyId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.is_completed).length || 0;
    const totalHours = sessions?.reduce((sum, s) => sum + (s.scheduled_hours || 0), 0) || 0;
    const completedHours = sessions?.filter(s => s.is_completed).reduce((sum, s) => sum + (s.scheduled_hours || 0), 0) || 0;

    return {
      technologyId,
      totalSessions,
      completedSessions,
      totalHours,
      completedHours,
      completionPercentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      hoursPercentage: totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0,
      sessions
    };
  }

  async getUserOverallProgress(userId: string) {
    // Buscar progresso geral do usuário
    const { data: sessions, error } = await supabase
      .from('technology_study_sessions')
      .select(`
        *,
        technology:technologies(id, name),
        subtopic:technology_subtopics(id, name, hours_required, difficulty_level)
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.is_completed).length || 0;
    const totalHours = sessions?.reduce((sum, s) => sum + (s.scheduled_hours || 0), 0) || 0;
    const completedHours = sessions?.filter(s => s.is_completed).reduce((sum, s) => sum + (s.scheduled_hours || 0), 0) || 0;

    // Agrupar por tecnologia
    const technologiesProgress = sessions?.reduce((acc, session) => {
      const techId = session.technology_id;
      if (!acc[techId]) {
        acc[techId] = {
          technology: session.technology,
          totalSessions: 0,
          completedSessions: 0,
          totalHours: 0,
          completedHours: 0
        };
      }

      acc[techId].totalSessions++;
      acc[techId].totalHours += session.scheduled_hours || 0;

      if (session.is_completed) {
        acc[techId].completedSessions++;
        acc[techId].completedHours += session.scheduled_hours || 0;
      }

      return acc;
    }, {} as any) || {};

    return {
      overall: {
        totalSessions,
        completedSessions,
        totalHours,
        completedHours,
        completionPercentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        hoursPercentage: totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0
      },
      technologies: Object.values(technologiesProgress)
    };
  }
}