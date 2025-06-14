import { supabase } from '../config/supabase.js';

interface SubSubject {
  id: string;
  subject_id: string;
  title: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  created_at?: string;
}

export class SubSubjectsService {
  async getSubSubjects(userId: string, subjectId: string) {
    // First verify the subject belongs to the user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select()
      .eq('id', subjectId)
      .eq('user_id', userId)
      .single();

    if (subjectError || !subject) {
      throw new Error('Subject not found or unauthorized');
    }

    const { data, error } = await supabase
      .from('sub_subjects')
      .select(`
        id,
        subject_id,
        title,
        difficulty,
        created_at
      `)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createSubSubject(userId: string, subjectId: string, data: {
    title: string;
    difficulty: 'fácil' | 'médio' | 'difícil';
  }) {
    // First verify the subject belongs to the user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select()
      .eq('id', subjectId)
      .eq('user_id', userId)
      .single();

    if (subjectError || !subject) {
      throw new Error('Subject not found or unauthorized');
    }

    const { data: subSubject, error } = await supabase
      .from('sub_subjects')
      .insert({
        subject_id: subjectId,
        title: data.title,
        difficulty: data.difficulty
      })
      .select()
      .single();

    if (error) throw error;
    return subSubject;
  }

  async updateSubSubject(userId: string, subSubjectId: string, updates: {
    title?: string;
    difficulty?: 'fácil' | 'médio' | 'difícil';
  }) {
    // First verify the sub-subject belongs to the user's subject
    const { data: subSubject, error: verifyError } = await supabase
      .from('sub_subjects')
      .select(`
        id,
        subject:subjects!inner (
          user_id
        )
      `)
      .eq('id', subSubjectId)
      .eq('subject.user_id', userId)
      .single();

    if (verifyError || !subSubject) {
      throw new Error('Sub-subject not found or unauthorized');
    }

    const { data, error } = await supabase
      .from('sub_subjects')
      .update(updates)
      .eq('id', subSubjectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSubSubject(userId: string, subSubjectId: string) {
    // First verify the sub-subject belongs to the user's subject
    const { data: subSubject, error: verifyError } = await supabase
      .from('sub_subjects')
      .select(`
        id,
        subject:subjects!inner (
          user_id
        )
      `)
      .eq('id', subSubjectId)
      .eq('subject.user_id', userId)
      .single();

    if (verifyError || !subSubject) {
      throw new Error('Sub-subject not found or unauthorized');
    }

    const { error } = await supabase
      .from('sub_subjects')
      .delete()
      .eq('id', subSubjectId);

    if (error) throw error;
  }
}