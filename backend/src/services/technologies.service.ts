import { supabase } from '../config/supabase.js';

interface CreateTechnologyData {
  name: string;
  description?: string;
  icon_name: string;
}

interface CreateTechnologySubtopicData {
  name: string;
  description?: string;
  hours_required: number;
  difficulty_level: 'iniciante' | 'intermediario' | 'avancado';
  order_index: number;
}

export class TechnologiesService {
  async getTechnologies() {
    const { data, error } = await supabase
      .from('technologies_with_hours')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getTechnologyById(id: string) {
    const { data, error } = await supabase
      .from('technologies')
      .select(`
        *,
        subtopics:technology_subtopics (
          id,
          name,
          description,
          hours_required,
          difficulty_level,
          order_index,
          is_active
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  async createTechnology(data: CreateTechnologyData) {
    const { data: technology, error } = await supabase
      .from('technologies')
      .insert({
        name: data.name,
        description: data.description,
        icon_name: data.icon_name,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Technology creation error:', error);
      throw new Error('Failed to create technology');
    }

    return technology;
  }

  async updateTechnology(id: string, updates: Partial<CreateTechnologyData>) {
    const { data, error } = await supabase
      .from('technologies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTechnology(id: string) {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('technologies')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  async getTechnologySubtopics(technologyId: string) {
    const { data, error } = await supabase
      .from('technology_subtopics')
      .select('*')
      .eq('technology_id', technologyId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createTechnologySubtopic(technologyId: string, data: CreateTechnologySubtopicData) {
    // First verify the technology exists and is active
    const { data: technology, error: techError } = await supabase
      .from('technologies')
      .select('id')
      .eq('id', technologyId)
      .eq('is_active', true)
      .single();

    if (techError || !technology) {
      throw new Error('Technology not found or inactive');
    }

    const { data: subtopic, error } = await supabase
      .from('technology_subtopics')
      .insert({
        technology_id: technologyId,
        name: data.name,
        description: data.description,
        hours_required: data.hours_required,
        difficulty_level: data.difficulty_level,
        order_index: data.order_index,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Technology subtopic creation error:', error);
      throw new Error('Failed to create technology subtopic');
    }

    return subtopic;
  }

  async updateTechnologySubtopic(subtopicId: string, updates: Partial<CreateTechnologySubtopicData>) {
    const { data, error } = await supabase
      .from('technology_subtopics')
      .update(updates)
      .eq('id', subtopicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTechnologySubtopic(subtopicId: string) {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('technology_subtopics')
      .update({ is_active: false })
      .eq('id', subtopicId);

    if (error) throw error;
  }

  async toggleTechnologyStatus(id: string) {
    // Get current status
    const { data: current, error: getCurrentError } = await supabase
      .from('technologies')
      .select('is_active')
      .eq('id', id)
      .single();

    if (getCurrentError) throw getCurrentError;

    // Toggle status
    const { data, error } = await supabase
      .from('technologies')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async checkAdminPermission(userId: string): Promise<boolean> {
    const { data: user, error } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return false;
    }

    return user.role === 'admin' && user.is_active === true;
  }

  async seedTechnologies() {
    try {
      // This method can be used to populate initial data
      // The data is already seeded via migration, but this can be used for updates
      
      const technologiesData = [
        {
          name: 'HTML',
          description: 'Linguagem de marcação para estruturar páginas web',
          icon_name: 'Globe'
        },
        {
          name: 'CSS',
          description: 'Linguagem de estilo para design e layout de páginas web',
          icon_name: 'Palette'
        },
        {
          name: 'JavaScript',
          description: 'Linguagem de programação para desenvolvimento web interativo',
          icon_name: 'Code'
        },
        {
          name: 'React',
          description: 'Biblioteca JavaScript para construção de interfaces de usuário',
          icon_name: 'Code'
        },
        {
          name: 'Node.js',
          description: 'Runtime JavaScript para desenvolvimento backend',
          icon_name: 'Server'
        },
        {
          name: 'Python',
          description: 'Linguagem de programação versátil e poderosa',
          icon_name: 'Code'
        },
        {
          name: 'Segurança',
          description: 'Conceitos e práticas de segurança em desenvolvimento',
          icon_name: 'Shield'
        },
        {
          name: 'Dados',
          description: 'Gerenciamento e manipulação de dados e bancos de dados',
          icon_name: 'Database'
        },
        {
          name: 'Cloud',
          description: 'Computação em nuvem e serviços cloud',
          icon_name: 'Cloud'
        }
      ];

      const results = [];
      
      for (const tech of technologiesData) {
        const { data, error } = await supabase
          .from('technologies')
          .upsert(tech, { 
            onConflict: 'name',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (error) {
          console.error(`Error seeding technology ${tech.name}:`, error);
        } else {
          results.push(data);
        }
      }

      return {
        message: 'Technologies seeded successfully',
        count: results.length,
        technologies: results
      };
    } catch (error) {
      console.error('Error seeding technologies:', error);
      throw error;
    }
  }

  async getTechnologyStats() {
    const { data: stats, error } = await supabase
      .from('technologies_with_hours')
      .select('*');

    if (error) throw error;

    const totalTechnologies = stats?.length || 0;
    const activeTechnologies = stats?.filter(t => t.is_active).length || 0;
    const totalHours = stats?.reduce((sum, t) => sum + (t.total_hours || 0), 0) || 0;
    const totalSubtopics = stats?.reduce((sum, t) => sum + (t.subtopics_count || 0), 0) || 0;

    return {
      totalTechnologies,
      activeTechnologies,
      totalHours,
      totalSubtopics,
      averageHoursPerTechnology: totalTechnologies > 0 ? Math.round(totalHours / totalTechnologies) : 0
    };
  }

  async searchTechnologies(query: string) {
    const { data, error } = await supabase
      .from('technologies_with_hours')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }
}