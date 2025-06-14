import { supabase } from '../config/supabase.js';

export class AuthService {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    return {
      session: data.session,
      user: userData,
    };
  }

  async register(email: string, password: string, fullName: string) {
    try {
      // Create the auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // The user profile will be created automatically by the database trigger
      // Just fetch the created user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        // Try to clean up the auth user if something went wrong
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        throw userError;
      }

      return {
        session: authData.session,
        user: userData
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        subscription:subscriptions (
          status,
          current_period_end
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: {
    full_name?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
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

  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        subscription:subscriptions (
          status,
          current_period_end
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateUser(userId: string, updates: {
    email?: string;
    full_name?: string;
    role?: string;
  }) {
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
}