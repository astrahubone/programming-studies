import { supabase } from '../config/supabase.js';

export class StudyService {
  async getStudySessions(userId: string) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        sub_subject:sub_subjects (
          id,
          title,
          difficulty,
          subject:subjects (
            id,
            title,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createStudySession(userId: string, data: {
    sub_subject_id: string;
    scheduled_date: string;
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

    // Create the study session with user_id
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({
        ...data,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Study session creation error:', error);
      throw new Error('Failed to create study session');
    }

    return session;
  }

  async updateStudySession(userId: string, sessionId: string, updates: any) {
    // First verify the session belongs to the user
    const { data: existingSession, error: verifyError } = await supabase
      .from('study_sessions')
      .select()
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !existingSession) {
      throw new Error('Study session not found or unauthorized');
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStudySession(userId: string, sessionId: string) {
    // First verify the session belongs to the user
    const { data: existingSession, error: verifyError } = await supabase
      .from('study_sessions')
      .select()
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !existingSession) {
      throw new Error('Study session not found or unauthorized');
    }

    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getQuestions(userId: string, subSubjectId: string) {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        sub_subject:sub_subjects (
          subject:subjects (
            user_id
          )
        )
      `)
      .eq('sub_subject_id', subSubjectId)
      .eq('sub_subject.subject.user_id', userId);

    if (error) throw error;
    return data;
  }

  async generateQuestions(userId: string, subSubjectId: string) {
    // This would integrate with OpenAI to generate questions
    // For now, return a placeholder implementation
    throw new Error('Not implemented');
  }

  async submitQuestions(userId: string, sessionId: string, answers: Array<{
    question_id: string;
    selected_answer: string;
  }>) {
    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select()
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      throw new Error('Study session not found or unauthorized');
    }

    // Get the questions to verify correct answers
    const questionIds = answers.map(a => a.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, correct_answer')
      .in('id', questionIds);

    if (questionsError) throw questionsError;

    const questionMap = new Map(questions?.map(q => [q.id, q.correct_answer]));
    const results = answers.map(answer => ({
      study_session_id: sessionId,
      question_id: answer.question_id,
      selected_answer: answer.selected_answer,
      is_correct: answer.selected_answer === questionMap.get(answer.question_id)
    }));

    const correctCount = results.filter(r => r.is_correct).length;

    // Insert results in a transaction
    const { error: resultsError } = await supabase
      .from('study_session_questions')
      .insert(results);

    if (resultsError) throw resultsError;

    // Update session completion status
    const { data: updatedSession, error: updateError } = await supabase
      .from('study_sessions')
      .update({
        completed_at: new Date().toISOString(),
        questions_total: answers.length,
        questions_correct: correctCount
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return updatedSession;
  }

  async resetStudyData(userId: string) {
    try {
      // Get all study sessions for the user
      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', userId);

        

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) {
        return { success: true }; // No data to reset
      }

      const sessionIds = sessions.map(s => s.id);

      // Delete all study session questions
      const { error: deleteQuestionsError } = await supabase
        .from('study_session_questions')
        .delete()
        .in('study_session_id', sessionIds);

      if (deleteQuestionsError) throw deleteQuestionsError;

      // Reset study sessions
      const { error: resetSessionsError } = await supabase
        .from('study_sessions')
        .delete()
        .in('id', sessionIds)
        .eq('user_id', userId);

      if (resetSessionsError) throw resetSessionsError;

      return { success: true };
    } catch (error) {
      console.error('Error resetting study data:', error);
      throw error;
    }
  }

  async getPerformanceStats(userId: string) {
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        sub_subject:sub_subjects (
          title,
          difficulty,
          subject:subjects (
            title,
            user_id
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    const completedSessions = sessions?.filter(s => s.completed_at).length || 0;
    const totalQuestions = sessions?.reduce((sum, s) => sum + (s.questions_total || 0), 0) || 0;
    const correctQuestions = sessions?.reduce((sum, s) => sum + (s.questions_correct || 0), 0) || 0;

    const subjectPerformance = new Map();
    sessions?.forEach(session => {
      const subjectTitle = session.sub_subject.subject.title;
      if (!subjectPerformance.has(subjectTitle)) {
        subjectPerformance.set(subjectTitle, {
          questionsTotal: 0,
          questionsCorrect: 0
        });
      }
      const stats = subjectPerformance.get(subjectTitle);
      stats.questionsTotal += session.questions_total || 0;
      stats.questionsCorrect += session.questions_correct || 0;
    });

    return {
      totalSessions,
      completedSessions,
      totalQuestions,
      correctQuestions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      successRate: totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0,
      subjectPerformance: Array.from(subjectPerformance.entries()).map(([subject, stats]) => ({
        subject,
        ...stats
      }))
    };
  }
}