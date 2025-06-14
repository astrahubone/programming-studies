import { supabase } from '../config/supabase.js';

interface UserFilters {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  status?: string;
}

export class AdminService {
  async getDashboardStats() {
    const [
      { count: totalUsers },
      { count: activeSubscriptions },
      { count: totalSubjects },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('subjects').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalRevenue: 0, // This would come from Stripe analytics
      totalSubjects: totalSubjects || 0,
    };
  }

  async getUsers(filters: UserFilters = {}) {
    const {
      page = 1,
      perPage = 10,
      search = '',
      role,
      status
    } = filters;

    let query = supabase
      .from('users')
      .select(`
        *,
        subscription:subscriptions (
          status,
          current_period_end
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'banned') {
      query = query.eq('is_active', false);
    }

    // Apply pagination
    const start = (page - 1) * perPage;
    query = query
      .range(start, start + perPage - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      perPage
    };
  }

  async createUser(email: string, password: string, fullName: string, role: string = 'user') {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) throw authError;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (userError) throw userError;
    return userData;
  }

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUser(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }

  async banUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        banned_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async unbanUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({
        is_active: true,
        banned_at: null,
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async promoteToAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      throw error;
    }
  }

  async demoteFromAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error demoting admin to user:', error);
      throw error;
    }
  }

  async getSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user:users (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async cancelSubscription(subscriptionId: string) {
    // This would integrate with Stripe to cancel the subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  }

  async getUsersPerformance() {
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        user:sub_subjects!inner(
          subject:subjects!inner(
            user_id,
            user:users!inner(
              full_name
            )
          )
        )
      `);

    if (error) throw error;

    const userStats = new Map();
    sessions?.forEach((session) => {
      const userId = session.user.subject.user_id;
      const userName = session.user.subject.user.full_name;

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userId,
          userName,
          totalSessions: 0,
          completedSessions: 0,
          totalQuestions: 0,
          correctQuestions: 0,
          completionRate: 0,
          successRate: 0,
        });
      }

      const stats = userStats.get(userId);
      stats.totalSessions++;
      if (session.completed_at) {
        stats.completedSessions++;
        stats.totalQuestions += session.questions_total || 0;
        stats.correctQuestions += session.questions_correct || 0;
      }
    });

    userStats.forEach((stats) => {
      stats.completionRate = (stats.completedSessions / stats.totalSessions) * 100;
      stats.successRate =
        stats.totalQuestions > 0 ? (stats.correctQuestions / stats.totalQuestions) * 100 : 0;
    });

    return Array.from(userStats.values());
  }

  async getDailyStats() {
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    const dailyMap = new Map();
    sessions?.forEach((session) => {
      const date = new Date(session.scheduled_date).toISOString().split('T')[0];

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          sessions: 0,
          completedSessions: 0,
          averageScore: 0,
        });
      }

      const stats = dailyMap.get(date);
      stats.sessions++;
      if (session.completed_at) {
        stats.completedSessions++;
        if (session.questions_total) {
          stats.averageScore =
            (stats.averageScore * (stats.completedSessions - 1) +
              ((session.questions_correct || 0) / session.questions_total) * 100) /
            stats.completedSessions;
        }
      }
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}