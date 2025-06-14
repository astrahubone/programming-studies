import { supabase } from '../config/supabase.js';

export class SubjectsService {
  async getSubjects(userId: string) {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        sub_subjects (
          id,
          title,
          difficulty
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createSubject(userId: string, data: { 
    title: string; 
    color?: string;
    sub_subjects?: Array<{
      title: string;
      difficulty: 'fácil' | 'médio' | 'difícil';
    }>;
  }) {
    // First verify user exists and is active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('User account is not active');
    }

    // Create the subject
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .insert({
        user_id: userId,
        title: data.title,
        color: data.color
      })
      .select()
      .single();

    if (subjectError) throw subjectError;

    // Create sub-subjects if provided
    if (data.sub_subjects && data.sub_subjects.length > 0) {
      const { error: subSubjectsError } = await supabase
        .from('sub_subjects')
        .insert(
          data.sub_subjects.map(sub => ({
            subject_id: subject.id,
            title: sub.title,
            difficulty: sub.difficulty
          }))
        );

      if (subSubjectsError) throw subSubjectsError;
    }

    // Return the complete subject with sub-subjects
    const { data: completeSubject, error: getError } = await supabase
      .from('subjects')
      .select(`
        *,
        sub_subjects (
          id,
          title,
          difficulty
        )
      `)
      .eq('id', subject.id)
      .single();

    if (getError) throw getError;
    return completeSubject;
  }

  async updateSubject(userId: string, subjectId: string, data: {
    title?: string;
    color?: string;
    sub_subjects?: Array<{
      title: string;
      difficulty: 'fácil' | 'médio' | 'difícil';
    }>;
  }) {
    // First verify the subject belongs to the user
    const { data: subject, error: verifyError } = await supabase
      .from('subjects')
      .select()
      .eq('id', subjectId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !subject) {
      throw new Error('Subject not found or unauthorized');
    }

    // Update subject
    const { error: updateError } = await supabase
      .from('subjects')
      .update({
        title: data.title,
        color: data.color
      })
      .eq('id', subjectId);

    if (updateError) throw updateError;

    // Update sub-subjects if provided
    if (data.sub_subjects) {
      // Delete existing sub-subjects
      const { error: deleteError } = await supabase
        .from('sub_subjects')
        .delete()
        .eq('subject_id', subjectId);

      if (deleteError) throw deleteError;

      // Create new sub-subjects
      if (data.sub_subjects.length > 0) {
        const { error: createError } = await supabase
          .from('sub_subjects')
          .insert(
            data.sub_subjects.map(sub => ({
              subject_id: subjectId,
              title: sub.title,
              difficulty: sub.difficulty
            }))
          );

        if (createError) throw createError;
      }
    }

    // Return updated subject with sub-subjects
    const { data: updatedSubject, error: getError } = await supabase
      .from('subjects')
      .select(`
        *,
        sub_subjects (
          id,
          title,
          difficulty
        )
      `)
      .eq('id', subjectId)
      .single();

    if (getError) throw getError;
    return updatedSubject;
  }

  async deleteSubject(userId: string, subjectId: string) {
    // First verify the subject belongs to the user
    const { data: subject, error: verifyError } = await supabase
      .from('subjects')
      .select()
      .eq('id', subjectId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !subject) {
      throw new Error('Subject not found or unauthorized');
    }

    // Delete the subject (this will cascade delete sub-subjects)
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    return { success: true };
  }
}